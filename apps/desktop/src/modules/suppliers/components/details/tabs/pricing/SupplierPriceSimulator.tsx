import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PriceRoundingMode,
  type BasePriceCalculationResult,
  type SupplierCategoryRuleDto,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

const QUICK_TEST_COSTS = [250, 500, 1500, 5000, 15000];

interface SupplierPriceSimulatorProps {
  simCost: number;
  onSimCostChange: (cost: number) => void;
  simCategoryId: string;
  onSimCategoryIdChange: (categoryId: string) => void;
  categories: SupplierCategoryRuleDto[];
  simulation: BasePriceCalculationResult;
  roundingMode?: PriceRoundingMode | string;
}

export const SupplierPriceSimulator: React.FC<SupplierPriceSimulatorProps> = ({
  simCost,
  onSimCostChange,
  simCategoryId,
  onSimCategoryIdChange,
  categories,
  simulation,
  roundingMode = PriceRoundingMode.NONE,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const profit = simulation.sellingPrice - simCost;
  const sharePercent =
    simulation.sellingPrice > 0 ? Math.round((profit / simulation.sellingPrice) * 1000) / 10 : 0;

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-2.5 border-b border-border/40">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2 text-balance">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          {t('suppliers:simulatorTitle', { defaultValue: 'Live Симулятор розрахунку ціни' })}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('suppliers:simulatorDesc', {
            defaultValue: 'Введіть вхідну собівартість та подивіться результат',
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3.5 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className={categories.length > 0 ? 'sm:col-span-7' : 'sm:col-span-12'}>
            <Label className="text-xs font-medium text-foreground block mb-1">
              {t('suppliers:simulatorCostPrice', {
                defaultValue: 'Вхідна ціна постачальника (₴):',
              })}
            </Label>
            <Input
              type="number"
              min="0"
              autoComplete="off"
              value={simCost}
              onChange={(e) => onSimCostChange(Math.max(0, Number(e.target.value)))}
              className="h-9 text-sm font-bold font-mono tabular-nums text-foreground"
              data-testid="simulator-cost-input"
            />
          </div>

          {categories.length > 0 && (
            <div className="sm:col-span-5">
              <Label className="text-xs font-medium text-foreground block mb-1 truncate">
                {t('suppliers:simulatorCategoryLabel', { defaultValue: 'Категорія товару:' })}
              </Label>
              <Select value={simCategoryId} onValueChange={onSimCategoryIdChange}>
                <SelectTrigger className="h-9 text-xs" data-testid="simulator-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    {t('suppliers:ruleScopeAllCategories', { defaultValue: 'Усі категорії' })}
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-2xs text-muted-foreground mr-1">
            {t('suppliers:simulatorQuickPresets', { defaultValue: 'Швидкий тест:' })}
          </span>
          {QUICK_TEST_COSTS.map((preset) => {
            const isSelected = simCost === preset;
            return (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSimCostChange(preset)}
                className={`h-6 px-2 text-2xs font-mono tabular-nums rounded-sm ${
                  isSelected
                    ? 'bg-card border-foreground/40 text-foreground font-semibold'
                    : 'bg-muted/15 border-border/50 text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`simulator-preset-${preset}`}
              >
                {preset}&nbsp;₴
              </Button>
            );
          })}
        </div>

        <div className="p-3 rounded-md bg-muted/25 divide-y divide-border/40 space-y-2">
          <div className="flex items-center justify-between text-xs pb-2">
            <span className="text-muted-foreground">
              {t('suppliers:simulatorAppliedRule', { defaultValue: 'Застосоване правило:' })}
            </span>
            <Badge variant="outline" className="rounded-sm text-2xs font-mono">
              {simulation.matchedRuleType === 'CATEGORY'
                ? t('suppliers:simulatorCategoryRule', { defaultValue: 'Правило категорії' })
                : simulation.matchedRuleType === 'PRICE_BRACKET'
                  ? t('suppliers:simulatorPriceBracket', { defaultValue: 'Діапазон цін' })
                  : t('suppliers:simulatorBaseMarkup', { defaultValue: 'Базова націнка' })}
            </Badge>
          </div>

          {roundingMode && roundingMode !== PriceRoundingMode.NONE && (
            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-muted-foreground">
                {t('suppliers:simulatorRoundingStep', { defaultValue: 'Крок округлення:' })}
              </span>
              <Badge variant="secondary" className="rounded-sm text-2xs font-mono">
                {roundingMode}
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-muted-foreground">
              {t('suppliers:simulatorFinalMarkup', { defaultValue: 'Підсумкова націнка:' })}
            </span>
            <span className="font-mono tabular-nums font-semibold text-foreground">
              +{simulation.appliedMarginPercent}%
              {simulation.appliedFixedMarkup ? ` +${simulation.appliedFixedMarkup}\u00A0₴` : ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2">
            <span className="text-muted-foreground">
              {t('suppliers:simulatorMarginProfit', { defaultValue: 'Маржинальний дохід:' })}
            </span>
            <span className="font-mono tabular-nums font-semibold text-success">
              +{profit.toFixed(2)}&nbsp;₴ ({sharePercent}%)
            </span>
          </div>

          <div className="pt-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {t('suppliers:simulatorSellingPrice', { defaultValue: 'Вихідна ціна продажу:' })}
            </span>
            <span
              className="text-lg font-bold font-mono tabular-nums text-primary"
              data-testid="simulated-selling-price"
            >
              {simulation.sellingPrice.toFixed(2)}&nbsp;₴
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
