import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SupplierDto,
  SupplierPricingRuleDto,
  ProductCategorySummaryDto,
  calculateBaseSellingPrice,
} from '@smartfeed/shared';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSupplierPricingRules,
  createSupplierPricingRule,
  deleteSupplierPricingRule,
  getCategoriesSummary,
} from '@/lib/api';
import { PricingSimulatorWidget } from '@/components/suppliers/PricingSimulatorWidget';
import { PricingRuleForm } from '@/components/suppliers/PricingRuleForm';
import { PricingRulesList } from '@/components/suppliers/PricingRulesList';

interface SupplierPricingRulesModalProps {
  supplier: SupplierDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SupplierPricingRulesModal({
  supplier,
  isOpen,
  onClose,
}: SupplierPricingRulesModalProps) {
  const { token } = useAuth();

  const [rules, setRules] = useState<SupplierPricingRuleDto[]>([]);
  const [categories, setCategories] = useState<ProductCategorySummaryDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Test Simulation State
  const [testCostPrice, setTestCostPrice] = useState<number>(500);
  const [testCategoryId, setTestCategoryId] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!supplier || !token) return;
    setError(null);
    try {
      const [rulesData, catsData] = await Promise.all([
        getSupplierPricingRules(supplier.id, token),
        getCategoriesSummary(token),
      ]);
      setRules(rulesData);
      setCategories(catsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося завантажити правила націнки';
      setError(msg);
    }
  }, [supplier, token]);

  useEffect(() => {
    if (isOpen && supplier) {
      loadData();
    }
  }, [isOpen, supplier, loadData]);

  const handleAddRule = async (dto: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    marginPercent: number;
    fixedMarkup: number;
    priority: number;
    isActive: boolean;
  }) => {
    if (!supplier || !token) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const created = await createSupplierPricingRule(supplier.id, dto, token);
      setRules((prev) => [created, ...prev]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка створення правила націнки';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!supplier || !token) return;
    try {
      await deleteSupplierPricingRule(supplier.id, ruleId, token);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося видалити правило';
      setError(msg);
    }
  };

  // Live simulation calculation
  const simulationResult = useMemo(() => {
    if (!supplier) return null;
    return calculateBaseSellingPrice({
      costPrice: testCostPrice || 0,
      defaultMarginPercent: supplier.defaultMarginPercent || 0,
      defaultFixedMarkup: supplier.defaultFixedMarkup || 0,
      categoryId: testCategoryId || undefined,
      rules: rules.map((r) => ({
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
  }, [supplier, testCostPrice, testCategoryId, rules]);

  if (!isOpen || !supplier) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-2xl p-6 flex flex-col justify-between">
        {/* 100% Solid Sticky Header */}
        <div className="sticky top-0 bg-card z-10 pb-4 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Правила націнки: {supplier.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Гнучка націнка за категоріями, діапазонами вхідних цін та базова націнка
                постачальника
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Simulator Panel */}
        <PricingSimulatorWidget
          testCostPrice={testCostPrice}
          testCategoryId={testCategoryId}
          categories={categories}
          simulationResult={simulationResult}
          onCostPriceChange={setTestCostPrice}
          onCategoryChange={setTestCategoryId}
        />

        {/* Add New Rule Form */}
        <PricingRuleForm
          categories={categories}
          isSubmitting={isSubmitting}
          onSubmit={handleAddRule}
        />

        {/* Existing Rules List */}
        <PricingRulesList
          rules={rules}
          defaultMarginPercent={supplier.defaultMarginPercent}
          defaultFixedMarkup={supplier.defaultFixedMarkup}
          onDeleteRule={handleDeleteRule}
        />
      </div>
    </div>,
    document.body,
  );
}
