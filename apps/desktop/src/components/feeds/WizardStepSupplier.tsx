import { SupplierDto } from '@smartfeed/shared';
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
import { Building2, Plus, Percent, RefreshCw, Layers } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface WizardStepSupplierProps {
  suppliers: SupplierDto[];
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
  autoUpdatePrices: boolean;
  setAutoUpdatePrices: (val: boolean) => void;
  autoUpdateStocks: boolean;
  setAutoUpdateStocks: (val: boolean) => void;
  onOpenCreateSupplier?: () => void;
}

export function WizardStepSupplier({
  suppliers,
  selectedSupplierId,
  setSelectedSupplierId,
  autoUpdatePrices,
  setAutoUpdatePrices,
  autoUpdateStocks,
  setAutoUpdateStocks,
  onOpenCreateSupplier,
}: WizardStepSupplierProps) {
  const { t } = useTranslation(['suppliers', 'common']);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const hasMarkup =
    selectedSupplier &&
    ((selectedSupplier.defaultMarginPercent || 0) > 0 ||
      (selectedSupplier.defaultFixedMarkup || 0) > 0);

  return (
    <div className="space-y-4">
      {/* Supplier Select / Empty State */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-foreground font-medium">
            {t('suppliers:selectSupplierLabel', { defaultValue: 'Оберіть постачальника' })}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {t('suppliers:suppliersCount', {
                count: suppliers.length,
                defaultValue: `Доступно: ${suppliers.length}`,
              })}
            </span>
            {suppliers.length > 0 && onOpenCreateSupplier && (
              <button
                type="button"
                onClick={onOpenCreateSupplier}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-0.5"
                data-testid="wizard-quick-add-supplier-link"
              >
                <Plus className="size-3" />
                <span>{t('suppliers:addSupplier', { defaultValue: 'Додати' })}</span>
              </button>
            )}
          </div>
        </div>

        {suppliers.length === 0 ? (
          <div
            data-testid="no-suppliers-warning"
            className="p-5 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center text-center space-y-3 animate-in fade-in duration-150"
          >
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                {t('suppliers:noSuppliersYet', { defaultValue: 'Постачальників ще не додано' })}
              </h4>
              <p className="text-[11px] text-muted-foreground max-w-sm">
                {t('suppliers:noSuppliersWizardDesc', {
                  defaultValue:
                    'Для імпорту товарів необхідно створити постачальника, щоб налаштувати правила націнки та синхронізацію.',
                })}
              </p>
            </div>
            {onOpenCreateSupplier && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenCreateSupplier}
                className="text-xs h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                data-testid="wizard-create-supplier-btn"
              >
                <Plus className="size-3.5" />
                <span>
                  {t('suppliers:quickCreateSupplier', {
                    defaultValue: 'Створити постачальника',
                  })}
                </span>
              </Button>
            )}
          </div>
        ) : (
          <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
            <SelectTrigger
              className="w-full h-9 text-xs bg-background border-border"
              data-testid="wizard-supplier-select"
            >
              <SelectValue
                placeholder={t('suppliers:chooseSupplierPlaceholder', {
                  defaultValue: 'Оберіть постачальника зі списку...',
                })}
              />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  className="text-xs cursor-pointer"
                  data-testid={`wizard-supplier-option-${s.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-muted-foreground font-mono text-[10px]">({s.code})</span>
                    <span className="text-muted-foreground text-[11px]">
                      — {s.defaultMarginPercent > 0 ? `+${s.defaultMarginPercent}% ` : ''}
                      {s.defaultFixedMarkup > 0 ? `+${s.defaultFixedMarkup} ₴` : ''}
                      {!s.defaultMarginPercent && !s.defaultFixedMarkup
                        ? t('suppliers:noMarkup', { defaultValue: 'Без націнки' })
                        : ''}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Selected Supplier Markup Card */}
      {selectedSupplier && (
        <div
          data-testid="wizard-selected-supplier-card"
          className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{selectedSupplier.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {selectedSupplier.code}
              </Badge>
            </div>
            <Badge
              variant="outline"
              data-testid="wizard-selected-supplier-markup"
              className="text-[11px] text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            >
              <Percent className="size-3 mr-1 text-primary" />
              {hasMarkup ? (
                <>
                  {selectedSupplier.defaultMarginPercent > 0 &&
                    `+${selectedSupplier.defaultMarginPercent}% `}
                  {selectedSupplier.defaultFixedMarkup > 0 &&
                    `+${selectedSupplier.defaultFixedMarkup} ₴`}
                </>
              ) : (
                '0% (Базова ціна)'
              )}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t('suppliers:markupAutoAppliedHint', {
              defaultValue:
                'Правила націнки цього постачальника будуть автоматично застосовані до закупівельних цін усіх товарів з фіду.',
            })}
          </p>
        </div>
      )}

      {/* Sync Options */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <Label className="text-xs text-foreground font-medium">
          {t('suppliers:syncOptionsTitle', {
            defaultValue: 'Параметри імпорту та синхронізації',
          })}
        </Label>

        <div className="space-y-2">
          <label className="flex items-center gap-2.5 p-2 rounded-md hover:bg-secondary/30 transition-colors cursor-pointer">
            <input
              type="checkbox"
              data-testid="wizard-auto-update-prices-checkbox"
              checked={autoUpdatePrices}
              onChange={(e) => setAutoUpdatePrices(e.target.checked)}
              className="size-4 rounded border-border accent-primary focus:ring-primary cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <RefreshCw className="size-3 text-primary" />
                {t('suppliers:autoUpdatePrices', {
                  defaultValue: 'Автоматично оновлювати ціни',
                })}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('suppliers:autoUpdatePricesHint', {
                  defaultValue: 'Перераховувати ціни існуючих товарів при наступних синхронізаціях',
                })}
              </div>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-md hover:bg-secondary/30 transition-colors cursor-pointer">
            <input
              type="checkbox"
              data-testid="wizard-auto-update-stocks-checkbox"
              checked={autoUpdateStocks}
              onChange={(e) => setAutoUpdateStocks(e.target.checked)}
              className="size-4 rounded border-border accent-primary focus:ring-primary cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <Layers className="size-3 text-primary" />
                {t('suppliers:autoUpdateStocks', {
                  defaultValue: 'Синхронізувати залишки та наявність',
                })}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('suppliers:autoUpdateStocksHint', {
                  defaultValue: 'Оновлювати статус наявності та кількість на складі',
                })}
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
