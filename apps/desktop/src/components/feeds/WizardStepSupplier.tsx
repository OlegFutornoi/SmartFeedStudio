import { SupplierDto } from '@smartfeed/shared';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Percent, RefreshCw, Layers } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface WizardStepSupplierProps {
  suppliers: SupplierDto[];
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
  autoUpdatePrices: boolean;
  setAutoUpdatePrices: (val: boolean) => void;
  autoUpdateStocks: boolean;
  setAutoUpdateStocks: (val: boolean) => void;
}

export function WizardStepSupplier({
  suppliers,
  selectedSupplierId,
  setSelectedSupplierId,
  autoUpdatePrices,
  setAutoUpdatePrices,
  autoUpdateStocks,
  setAutoUpdateStocks,
}: WizardStepSupplierProps) {
  const { t } = useTranslation(['suppliers', 'common']);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  const hasMarkup =
    selectedSupplier &&
    ((selectedSupplier.defaultMarginPercent || 0) > 0 ||
      (selectedSupplier.defaultFixedMarkup || 0) > 0);

  return (
    <div className="space-y-4">
      {/* Supplier Select */}
      <div className="space-y-2">
        <Label className="text-xs text-foreground font-medium flex items-center justify-between">
          <span>
            {t('suppliers:selectSupplierLabel', { defaultValue: 'Оберіть постачальника' })}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t('suppliers:suppliersCount', {
              count: suppliers.length,
              defaultValue: `Доступно: ${suppliers.length}`,
            })}
          </span>
        </Label>

        <select
          value={selectedSupplierId}
          onChange={(e) => setSelectedSupplierId(e.target.value)}
          className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="" disabled>
            {t('suppliers:chooseSupplierPlaceholder', {
              defaultValue: '-- Оберіть постачальника --',
            })}
          </option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code}) —{' '}
              {s.defaultMarginPercent > 0 ? `+${s.defaultMarginPercent}% ` : ''}
              {s.defaultFixedMarkup > 0 ? `+${s.defaultFixedMarkup} ₴` : ''}
              {!s.defaultMarginPercent && !s.defaultFixedMarkup ? '0% націнки' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Supplier Markup Card */}
      {selectedSupplier && (
        <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{selectedSupplier.name}</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {selectedSupplier.code}
              </Badge>
            </div>
            <Badge
              variant="outline"
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
          {t('suppliers:syncOptionsTitle', { defaultValue: 'Параметри імпорту та синхронізації' })}
        </Label>

        <div className="space-y-2">
          <label className="flex items-center gap-2.5 p-2 rounded-md hover:bg-secondary/30 transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={autoUpdatePrices}
              onChange={(e) => setAutoUpdatePrices(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="text-xs">
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <RefreshCw className="size-3 text-primary" />
                {t('suppliers:autoUpdatePrices', { defaultValue: 'Автоматично оновлювати ціни' })}
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
              checked={autoUpdateStocks}
              onChange={(e) => setAutoUpdateStocks(e.target.checked)}
              className="size-4 rounded border-border text-primary focus:ring-primary"
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
