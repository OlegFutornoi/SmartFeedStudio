import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  SupplierDto,
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
  type CustomRoundingRuleDto,
  type CustomRoundingRuleType,
  buildCustomRoundingRule,
} from '@smartfeed/shared';
import { fetchLiveExchangeRates, updateSupplier } from '@/lib/api';
import { DEFAULT_RATES, type BankExchangeRate } from '@/lib/api/currencies';
import { useAuth } from '@/contexts/AuthContext';

interface UseSupplierCurrenciesStateParams {
  supplier: SupplierDto;
  onRefreshSupplier: () => void;
}

export {
  CURRENCY_OPTIONS,
  MODE_OPTIONS,
  ROUNDING_OPTIONS,
  BUFFER_PRESETS,
  resolveInitialSupplierRates,
} from '@/modules/suppliers/components/details/tabs/currencies/currencies.constants';
import { resolveInitialSupplierRates } from '@/modules/suppliers/components/details/tabs/currencies/currencies.constants';

export function useSupplierCurrenciesState({
  supplier,
  onRefreshSupplier,
}: UseSupplierCurrenciesStateParams) {
  const { token } = useAuth();
  const init = resolveInitialSupplierRates(supplier);

  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(init.currency);
  const [exchangeMode, setExchangeMode] = useState<ExchangeRateMode>(init.mode);
  const [manualRate, setManualRate] = useState<number>(init.rate);
  const [bufferPercent, setBufferPercent] = useState<number>(init.buffer);
  const [roundingMode, setRoundingMode] = useState<PriceRoundingMode | string>(init.rounding);
  const [customRoundingRules, setCustomRoundingRules] = useState<CustomRoundingRuleDto[]>(
    init.rules,
  );
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>(init.bankId);

  const [liveRates, setLiveRates] = useState<Record<CurrencyCode, number>>({ ...DEFAULT_RATES });
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFetchingRef = useRef(false);
  const hasLoadedInitialRef = useRef(false);

  const loadRates = useCallback(async (force = false) => {
    if (isFetchingRef.current && !force) return;
    isFetchingRef.current = true;
    setIsFetchingRates(true);
    try {
      const rates = await fetchLiveExchangeRates(force);
      setLiveRates(rates);
    } catch (err) {
      console.warn('[useSupplierCurrenciesState:loadRates] Error:', err);
    } finally {
      isFetchingRef.current = false;
      setIsFetchingRates(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedInitialRef.current) {
      hasLoadedInitialRef.current = true;
      void loadRates(false);
    }
  }, [loadRates]);

  useEffect(() => {
    const s = resolveInitialSupplierRates(supplier);
    setBaseCurrency(s.currency);
    setExchangeMode(s.mode);
    setManualRate(s.rate);
    setBufferPercent(s.buffer);
    setRoundingMode(s.rounding);
    setCustomRoundingRules(s.rules);
    setSelectedBankId(s.bankId);
  }, [supplier]);

  const handleBaseCurrencyChange = useCallback(
    (nextCurrency: CurrencyCode) => {
      setBaseCurrency(nextCurrency);
      if (nextCurrency === CurrencyCode.UAH) {
        setManualRate(1.0);
        setSelectedBankId(undefined);
        return;
      }
      if (
        nextCurrency === supplier.baseCurrency &&
        supplier.exchangeRate &&
        Number(supplier.exchangeRate) > 1
      ) {
        setManualRate(Number(supplier.exchangeRate));
        return;
      }
      setManualRate(liveRates[nextCurrency] || 1.0);
      if (!selectedBankId) setSelectedBankId('nbu');
    },
    [liveRates, selectedBankId, supplier.baseCurrency, supplier.exchangeRate],
  );

  const handleExchangeModeChange = useCallback(
    (nextMode: ExchangeRateMode) => {
      setExchangeMode(nextMode);
      if (baseCurrency === CurrencyCode.UAH) return;
      if (nextMode === ExchangeRateMode.AUTO_NBU) {
        setSelectedBankId('nbu');
        setManualRate(liveRates[baseCurrency] || 1.0);
      } else if (nextMode === ExchangeRateMode.AUTO_PRIVAT) {
        setSelectedBankId('privat');
      }
    },
    [baseCurrency, liveRates],
  );

  const activeRate = useMemo(() => {
    if (baseCurrency === CurrencyCode.UAH) return 1.0;
    const fallback = liveRates[baseCurrency] || 1.0;
    if (exchangeMode === ExchangeRateMode.AUTO_NBU)
      return liveRates[baseCurrency] || manualRate || fallback;
    return manualRate > 0 ? manualRate : fallback;
  }, [baseCurrency, exchangeMode, manualRate, liveRates]);

  const effectiveRate = useMemo(() => {
    if (baseCurrency === CurrencyCode.UAH) return 1.0;
    const safeBuffer = Math.max(0, Math.min(100, bufferPercent || 0));
    return Math.round(activeRate * (1 + safeBuffer / 100) * 100) / 100;
  }, [activeRate, baseCurrency, bufferPercent]);

  const handleSelectBankRate = useCallback((bankRate: BankExchangeRate) => {
    setSelectedBankId(bankRate.bankId);
    setBaseCurrency(bankRate.currency);
    setManualRate(bankRate.sellRate);
    if (bankRate.bankId === 'nbu') setExchangeMode(ExchangeRateMode.AUTO_NBU);
    else if (bankRate.bankId === 'privat') setExchangeMode(ExchangeRateMode.AUTO_PRIVAT);
    else setExchangeMode(ExchangeRateMode.MANUAL);
  }, []);

  const handleBankRatesSynced = useCallback(
    (currency: CurrencyCode, rates: BankExchangeRate[]) => {
      const nbu = rates.find((r) => r.bankId === 'nbu');
      if (nbu && nbu.sellRate > 0) {
        setLiveRates((prev) =>
          prev[currency] === nbu.sellRate ? prev : { ...prev, [currency]: nbu.sellRate },
        );
      }
      if (currency === baseCurrency) {
        const matchedBank =
          (selectedBankId ? rates.find((r) => r.bankId === selectedBankId) : undefined) || nbu;
        if (matchedBank && matchedBank.sellRate > 0 && (!manualRate || manualRate <= 1)) {
          setManualRate(matchedBank.sellRate);
        }
      }
    },
    [baseCurrency, manualRate, selectedBankId],
  );

  const isDirty = useMemo(() => {
    const savedCurr = supplier.baseCurrency || CurrencyCode.UAH;
    const savedMode = supplier.exchangeRateMode || ExchangeRateMode.MANUAL;
    const savedRate = Number(supplier.exchangeRate || 1.0);
    const savedBuffer = Number(supplier.currencyBufferPercent || 0);
    const savedRounding = supplier.priceRounding || PriceRoundingMode.NONE;
    const savedBankId = supplier.selectedBankId ?? undefined;
    return (
      baseCurrency !== savedCurr ||
      exchangeMode !== savedMode ||
      selectedBankId !== savedBankId ||
      Math.abs(activeRate - savedRate) > 0.001 ||
      Math.abs(bufferPercent - savedBuffer) > 0.001 ||
      roundingMode !== savedRounding
    );
  }, [
    activeRate,
    baseCurrency,
    bufferPercent,
    exchangeMode,
    roundingMode,
    selectedBankId,
    supplier,
  ]);

  const handleResetChanges = useCallback(() => {
    const s = resolveInitialSupplierRates(supplier);
    setBaseCurrency(s.currency);
    setExchangeMode(s.mode);
    setManualRate(s.rate);
    setBufferPercent(s.buffer);
    setRoundingMode(s.rounding);
    setSelectedBankId(s.bankId);
    setCustomRoundingRules(s.rules);
  }, [supplier]);

  const handleAddCustomRoundingRule = useCallback(
    async (type: CustomRoundingRuleType, rawValue: number) => {
      const rule = buildCustomRoundingRule(type, rawValue);
      const nextRules = [...customRoundingRules.filter((item) => item.code !== rule.code), rule];
      setCustomRoundingRules(nextRules);
      setRoundingMode(rule.code);
      try {
        await updateSupplier(
          supplier.id,
          { priceRounding: rule.code, customRoundingRules: nextRules },
          token || undefined,
        );
        onRefreshSupplier();
      } catch (err) {
        console.warn('[useSupplierCurrenciesState:handleAddCustomRoundingRule] Error:', err);
      }
    },
    [customRoundingRules, onRefreshSupplier, supplier.id, token],
  );

  const handleDeleteCustomRoundingRule = useCallback(
    async (code: string) => {
      const nextRules = customRoundingRules.filter((item) => item.code !== code);
      const nextRounding = roundingMode === code ? PriceRoundingMode.NONE : roundingMode;
      setCustomRoundingRules(nextRules);
      setRoundingMode(nextRounding);
      try {
        await updateSupplier(
          supplier.id,
          { priceRounding: nextRounding, customRoundingRules: nextRules },
          token || undefined,
        );
        onRefreshSupplier();
      } catch (err) {
        console.warn('[useSupplierCurrenciesState:handleDeleteCustomRoundingRule] Error:', err);
      }
    },
    [customRoundingRules, onRefreshSupplier, roundingMode, supplier.id, token],
  );

  const handleSaveCurrencyConfig = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSupplier(
        supplier.id,
        {
          baseCurrency,
          exchangeRateMode: exchangeMode,
          exchangeRate: activeRate,
          currencyBufferPercent: baseCurrency === CurrencyCode.UAH ? 0 : bufferPercent,
          priceRounding: roundingMode,
          customRoundingRules,
          selectedBankId: selectedBankId ?? null,
        },
        token || undefined,
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierCurrenciesState:handleSaveCurrencyConfig] Error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [
    activeRate,
    baseCurrency,
    bufferPercent,
    customRoundingRules,
    exchangeMode,
    onRefreshSupplier,
    roundingMode,
    selectedBankId,
    supplier.id,
    token,
  ]);

  return {
    baseCurrency,
    handleBaseCurrencyChange,
    exchangeMode,
    handleExchangeModeChange,
    activeRate,
    effectiveRate,
    setManualRate,
    bufferPercent,
    setBufferPercent,
    roundingMode,
    setRoundingMode,
    customRoundingRules,
    handleAddCustomRoundingRule,
    handleDeleteCustomRoundingRule,
    selectedBankId,
    handleSelectBankRate,
    handleBankRatesSynced,
    isFetchingRates,
    loadRates,
    isSaving,
    isDirty,
    handleResetChanges,
    handleSaveCurrencyConfig,
  };
}
