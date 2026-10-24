import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  type SupplierDto,
  type SupplierPricingRuleDto,
  type SupplierCategoryRuleDto,
  PriceRoundingMode,
  calculateBaseSellingPrice,
  applyPriceRounding,
} from '@smartfeed/shared';
import {
  getSupplierPricingRules,
  createSupplierPricingRule,
  bulkCreateSupplierPricingRules,
  updateSupplierPricingRule,
  deleteSupplierPricingRule,
  getSupplierCategories,
  updateSupplier,
} from '@/lib/api';

const DEFAULT_RETAIL_TIERS = [
  { minPrice: 0, maxPrice: 500, marginPercent: 35, fixedMarkup: 0, priority: 10 },
  { minPrice: 500, maxPrice: 2000, marginPercent: 25, fixedMarkup: 0, priority: 20 },
  { minPrice: 2000, maxPrice: 10000, marginPercent: 15, fixedMarkup: 0, priority: 30 },
  { minPrice: 10000, maxPrice: null, marginPercent: 10, fixedMarkup: 0, priority: 40 },
];

export function sortPricingRules(list: SupplierPricingRuleDto[]): SupplierPricingRuleDto[] {
  return [...list].sort((a, b) => {
    const aHasCat = Boolean(a.categoryId);
    const bHasCat = Boolean(b.categoryId);
    if (aHasCat !== bHasCat) return aHasCat ? -1 : 1;
    const minA = a.minPrice ?? 0;
    const minB = b.minPrice ?? 0;
    if (minA !== minB) return minA - minB;
    const maxA = a.maxPrice ?? Number.MAX_SAFE_INTEGER;
    const maxB = b.maxPrice ?? Number.MAX_SAFE_INTEGER;
    return maxA - maxB;
  });
}

export function useSupplierPricingState(
  supplier: SupplierDto,
  token: string | null,
  onRefreshSupplier: () => void,
) {
  const [rules, setRules] = useState<SupplierPricingRuleDto[]>([]);
  const [categories, setCategories] = useState<SupplierCategoryRuleDto[]>([]);
  const [globalMargin, setGlobalMargin] = useState<number>(supplier.defaultMarginPercent || 0);
  const [globalFixed, setGlobalFixed] = useState<number>(supplier.defaultFixedMarkup || 0);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [ruleMargin, setRuleMargin] = useState<string>('20');
  const [ruleFixed, setRuleFixed] = useState<string>('0');

  const [simCost, setSimCost] = useState<number>(500);
  const [simCategoryId, setSimCategoryId] = useState<string>('ALL');

  const isFetchingRef = useRef(false);
  const lastFetchedSupplierIdRef = useRef<string | null>(null);

  useEffect(() => {
    setGlobalMargin(supplier.defaultMarginPercent || 0);
    setGlobalFixed(supplier.defaultFixedMarkup || 0);
  }, [supplier.id, supplier.defaultMarginPercent, supplier.defaultFixedMarkup]);

  const loadPricingData = useCallback(
    async (force = false) => {
      if (isFetchingRef.current && !force) return;
      if (!force && lastFetchedSupplierIdRef.current === supplier.id) return;

      isFetchingRef.current = true;
      lastFetchedSupplierIdRef.current = supplier.id;
      try {
        const [rulesData, catsData] = await Promise.all([
          getSupplierPricingRules(supplier.id, token || undefined),
          getSupplierCategories(supplier.id, token || undefined).catch(() => []),
        ]);
        const sorted = sortPricingRules(rulesData || []);
        setRules(sorted);
        setCategories(catsData || []);
      } catch (err) {
        console.warn('[useSupplierPricingState:loadPricingData] Error:', err);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [supplier.id, token],
  );

  useEffect(() => {
    void loadPricingData();
  }, [loadPricingData]);

  const sortedRules = useMemo(() => sortPricingRules(rules), [rules]);

  const hasRangeError = useMemo(() => {
    if (minPrice === '' || maxPrice === '') return false;
    const min = Number(minPrice);
    const max = Number(maxPrice);
    return !Number.isNaN(min) && !Number.isNaN(max) && max <= min;
  }, [minPrice, maxPrice]);

  const hasOverlapWarning = useMemo(() => {
    if (hasRangeError || (minPrice === '' && maxPrice === '')) return false;
    const min = minPrice !== '' ? Number(minPrice) : 0;
    const max = maxPrice !== '' ? Number(maxPrice) : Infinity;
    const targetCat = selectedCategoryId === 'ALL' ? null : selectedCategoryId;

    return sortedRules.some((r) => {
      if (!r.isActive || r.id === editingRuleId) return false;
      if ((r.categoryId || null) !== targetCat) return false;
      const rMin = r.minPrice ?? 0;
      const rMax = r.maxPrice ?? Infinity;
      return min < rMax && max > rMin;
    });
  }, [hasRangeError, minPrice, maxPrice, selectedCategoryId, sortedRules, editingRuleId]);

  const simulation = useMemo(() => {
    const roundingMode = supplier.priceRounding || PriceRoundingMode.NONE;
    const baseCalc = calculateBaseSellingPrice({
      costPrice: simCost,
      defaultMarginPercent: globalMargin,
      defaultFixedMarkup: globalFixed,
      categoryId: simCategoryId === 'ALL' ? null : simCategoryId,
      rules: sortedRules.map((r) => ({
        id: r.id,
        categoryId: r.categoryId,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
        marginPercent: r.marginPercent,
        fixedMarkup: r.fixedMarkup,
        priority: r.priority,
        isActive: r.isActive,
      })),
    });
    const finalPrice = applyPriceRounding(baseCalc.sellingPrice, roundingMode);
    return {
      ...baseCalc,
      sellingPrice: finalPrice,
    };
  }, [simCost, simCategoryId, globalMargin, globalFixed, sortedRules, supplier.priceRounding]);

  const handleSaveGlobalMarkup = async () => {
    setIsSavingGlobal(true);
    try {
      await updateSupplier(
        supplier.id,
        { defaultMarginPercent: globalMargin, defaultFixedMarkup: globalFixed },
        token || undefined,
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierPricingState:handleSaveGlobalMarkup] Error:', err);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const resetComposer = (nextMinPrice = '') => {
    setEditingRuleId(null);
    setSelectedCategoryId('ALL');
    setMinPrice(nextMinPrice);
    setMaxPrice('');
    setRuleMargin('20');
    setRuleFixed('0');
  };

  const handleStartEdit = (rule: SupplierPricingRuleDto) => {
    setEditingRuleId(rule.id);
    setSelectedCategoryId(rule.categoryId || 'ALL');
    setMinPrice(rule.minPrice != null ? String(rule.minPrice) : '');
    setMaxPrice(rule.maxPrice != null ? String(rule.maxPrice) : '');
    setRuleMargin(String(rule.marginPercent ?? 0));
    setRuleFixed(String(rule.fixedMarkup ?? 0));
  };

  const handleSubmitRule = async () => {
    if (hasRangeError) return;
    if (ruleMargin === '' && ruleFixed === '') return;

    setIsSubmittingRule(true);
    const catId = selectedCategoryId === 'ALL' ? null : selectedCategoryId;
    const catObj = categories.find((c) => c.id === catId || c.feedCategoryId === catId);
    const payload = {
      categoryId: catId,
      categoryNameUk: catObj ? catObj.name : null,
      minPrice: minPrice !== '' ? Number(minPrice) : null,
      maxPrice: maxPrice !== '' ? Number(maxPrice) : null,
      marginPercent: Number(ruleMargin || 0),
      fixedMarkup: Number(ruleFixed || 0),
      priority: catId ? 100 : 10,
      isActive: true,
    };

    try {
      if (editingRuleId) {
        const updated = await updateSupplierPricingRule(
          supplier.id,
          editingRuleId,
          payload,
          token || undefined,
        );
        setRules((prev) =>
          sortPricingRules(prev.map((r) => (r.id === editingRuleId ? updated : r))),
        );
        resetComposer('');
      } else {
        const created = await createSupplierPricingRule(supplier.id, payload, token || undefined);
        setRules((prev) => sortPricingRules([...prev, created]));
        const nextMin = maxPrice !== '' ? maxPrice : '';
        resetComposer(nextMin);
      }
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierPricingState:handleSubmitRule] Error:', err);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const handleToggleRuleActive = async (rule: SupplierPricingRuleDto) => {
    const nextActive = !rule.isActive;
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, isActive: nextActive } : r)));
    try {
      await updateSupplierPricingRule(
        supplier.id,
        rule.id,
        { isActive: nextActive },
        token || undefined,
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierPricingState:handleToggleRuleActive] Error:', err);
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: rule.isActive } : r)),
      );
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteSupplierPricingRule(supplier.id, ruleId, token || undefined);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      if (editingRuleId === ruleId) resetComposer('');
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierPricingState:handleDeleteRule] Error:', err);
    }
  };

  const handleApplyDefaultTiers = async () => {
    setIsSubmittingRule(true);
    try {
      const tiersToCreate = DEFAULT_RETAIL_TIERS.map((tier) => ({ ...tier, isActive: true }));
      const createdList = await bulkCreateSupplierPricingRules(
        supplier.id,
        tiersToCreate,
        false,
        token || undefined,
      );
      setRules((prev) => sortPricingRules([...prev, ...createdList]));
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierPricingState:handleApplyDefaultTiers] Error:', err);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const handleSelectRuleForSimulation = (rule: SupplierPricingRuleDto) => {
    const min = rule.minPrice ?? 0;
    const max = rule.maxPrice;
    const sampleCost = max != null ? Math.round((min + max) / 2) : Math.max(min + 500, 1000);
    setSimCost(sampleCost > 0 ? sampleCost : 500);
    setSimCategoryId(rule.categoryId || 'ALL');
  };

  return {
    rules: sortedRules,
    categories,
    globalMargin,
    setGlobalMargin,
    globalFixed,
    setGlobalFixed,
    isSavingGlobal,
    isSubmittingRule,
    editingRuleId,
    selectedCategoryId,
    setSelectedCategoryId,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    ruleMargin,
    setRuleMargin,
    ruleFixed,
    setRuleFixed,
    hasRangeError,
    hasOverlapWarning,
    simCost,
    setSimCost,
    simCategoryId,
    setSimCategoryId,
    simulation,
    handleSaveGlobalMarkup,
    handleStartEdit,
    handleCancelEdit: () => resetComposer(''),
    handleSubmitRule,
    handleToggleRuleActive,
    handleDeleteRule,
    handleApplyDefaultTiers,
    handleSelectRuleForSimulation,
  };
}
