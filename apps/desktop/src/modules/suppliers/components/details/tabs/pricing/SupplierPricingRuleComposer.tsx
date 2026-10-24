import React from 'react';
import { Plus, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SupplierCategoryRuleDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface SupplierPricingRuleComposerProps {
  categories: SupplierCategoryRuleDto[];
  editingRuleId: string | null;
  selectedCategoryId: string;
  onSelectCategoryId: (val: string) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  ruleMargin: string;
  onRuleMarginChange: (val: string) => void;
  ruleFixed: string;
  onRuleFixedChange: (val: string) => void;
  hasRangeError: boolean;
  hasOverlapWarning: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancelEdit: () => void;
}

export const SupplierPricingRuleComposer: React.FC<SupplierPricingRuleComposerProps> = ({
  categories,
  editingRuleId,
  selectedCategoryId,
  onSelectCategoryId,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  ruleMargin,
  onRuleMarginChange,
  ruleFixed,
  onRuleFixedChange,
  hasRangeError,
  hasOverlapWarning,
  isSubmitting,
  onSubmit,
  onCancelEdit,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div
      className="px-3.5 py-3 bg-muted/20 border-b border-border/50 space-y-2.5"
      data-testid="pricing-rule-composer"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">
          {editingRuleId
            ? t('suppliers:ruleEditTitle', { defaultValue: 'Редагування правила' })
            : t('suppliers:ruleCreateTitle', {
                defaultValue: 'Конструктор правила (Умова ➔ Націнка)',
              })}
        </span>
        {editingRuleId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelEdit}
            className="h-6 px-2 text-2xs gap-1 text-muted-foreground hover:text-foreground"
            data-testid="cancel-edit-rule-btn"
          >
            <X className="size-3" />
            {t('suppliers:ruleCancelEditBtn', { defaultValue: 'Скасувати' })}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
        {categories.length > 0 && (
          <div className="col-span-2 sm:col-span-3">
            <Label className="text-2xs text-muted-foreground block mb-1 truncate">
              {t('suppliers:ruleScopeLabel', { defaultValue: 'Сфера дії' })}
            </Label>
            <Select value={selectedCategoryId} onValueChange={onSelectCategoryId}>
              <SelectTrigger
                className="h-8 text-xs bg-background"
                data-testid="rule-category-select"
              >
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

        <div
          className={
            categories.length > 0 ? 'col-span-1 sm:col-span-2' : 'col-span-1 sm:col-span-3'
          }
        >
          <Label className="text-2xs text-muted-foreground block mb-1 truncate">
            {t('suppliers:ruleFromLabel', { defaultValue: 'Від (₴)' })}
          </Label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            autoComplete="off"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="h-8 text-xs font-mono tabular-nums bg-background"
            data-testid="rule-min-price-input"
          />
        </div>

        <div
          className={
            categories.length > 0 ? 'col-span-1 sm:col-span-2' : 'col-span-1 sm:col-span-3'
          }
        >
          <Label className="text-2xs text-muted-foreground block mb-1 truncate">
            {t('suppliers:ruleToLabel', { defaultValue: 'До (₴)' })}
          </Label>
          <Input
            type="number"
            min="0"
            placeholder={t('suppliers:ruleToInfinityPlaceholder', {
              defaultValue: '∞ (без межі)',
            })}
            autoComplete="off"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="h-8 text-xs font-mono tabular-nums bg-background"
            data-testid="rule-max-price-input"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label className="text-2xs text-muted-foreground block mb-1 truncate">
            {t('suppliers:ruleMarginPercent', { defaultValue: 'Націнка (%)' })}
          </Label>
          <Input
            type="number"
            min="0"
            autoComplete="off"
            value={ruleMargin}
            onChange={(e) => onRuleMarginChange(e.target.value)}
            className="h-8 text-xs font-mono tabular-nums bg-background"
            data-testid="rule-margin-input"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label className="text-2xs text-muted-foreground block mb-1 truncate">
            {t('suppliers:ruleFixedMarkup', { defaultValue: 'Фіксовано (₴)' })}
          </Label>
          <Input
            type="number"
            min="0"
            autoComplete="off"
            value={ruleFixed}
            onChange={(e) => onRuleFixedChange(e.target.value)}
            className="h-8 text-xs font-mono tabular-nums bg-background"
            data-testid="rule-fixed-input"
          />
        </div>

        <div
          className={
            categories.length > 0 ? 'col-span-2 sm:col-span-1' : 'col-span-2 sm:col-span-2'
          }
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting || hasRangeError}
            onClick={onSubmit}
            className="w-full h-8 text-xs gap-1 bg-background hover:bg-muted font-medium"
            title={
              editingRuleId
                ? t('suppliers:ruleUpdateBtn', { defaultValue: 'Оновити правило' })
                : t('suppliers:addRuleBtn', { defaultValue: 'Додати правило' })
            }
            data-testid="submit-pricing-rule-btn"
          >
            {editingRuleId ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            <span className={categories.length > 0 ? 'sm:sr-only' : 'truncate'}>
              {editingRuleId
                ? t('suppliers:ruleUpdateBtn', { defaultValue: 'Оновити правило' })
                : t('suppliers:addRuleBtn', { defaultValue: 'Додати правило' })}
            </span>
          </Button>
        </div>
      </div>

      {(hasRangeError || hasOverlapWarning) && (
        <div className="flex items-center gap-1.5 text-2xs">
          <AlertCircle className="size-3.5 shrink-0 text-destructive" />
          <span
            className={hasRangeError ? 'text-destructive font-medium' : 'text-muted-foreground'}
          >
            {hasRangeError
              ? t('suppliers:ruleMinMaxError', {
                  defaultValue: 'Максимальна ціна має бути більшою за мінімальну',
                })
              : t('suppliers:ruleOverlapWarning', {
                  defaultValue: 'Увага: діапазон перетинається з іншим активним правилом',
                })}
          </span>
        </div>
      )}
    </div>
  );
};
