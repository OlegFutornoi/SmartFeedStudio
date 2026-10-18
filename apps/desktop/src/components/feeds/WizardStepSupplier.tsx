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
import { Truck, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { FeedAnalysisResult } from '@/lib/api';
import { WizardPricingSimulator } from '@/components/feeds/WizardPricingSimulator';

interface WizardStepSupplierProps {
  suppliers: SupplierDto[];
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
  analysis?: FeedAnalysisResult | null;
  autoUpdatePrices?: boolean;
  setAutoUpdatePrices?: (val: boolean) => void;
  autoUpdateStocks?: boolean;
  setAutoUpdateStocks?: (val: boolean) => void;
  onOpenCreateSupplier?: () => void;
  error?: string | null;
}

export function WizardStepSupplier({
  suppliers,
  selectedSupplierId,
  setSelectedSupplierId,
  analysis,
  onOpenCreateSupplier,
  error,
}: WizardStepSupplierProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <div className="space-y-3 pt-0">
      {error && (
        <div
          data-testid="wizard-supplier-error"
          className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in duration-150"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 2-Column Bar: Supplier Selector + Sync Policy Notice */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        <div className="md:col-span-7 p-3 rounded-lg border border-border/60 bg-card flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-foreground font-medium">
              {t('suppliers:selectSupplierLabel', { defaultValue: 'Оберіть постачальника' })}
            </Label>
            {selectedSupplier && (
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-2xs font-mono tabular-nums px-1.5 py-0 h-5 bg-muted/40 border-border/60 text-muted-foreground"
                >
                  {selectedSupplier.code}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-2xs font-mono tabular-nums px-1.5 py-0 h-5 bg-background border-border text-foreground"
                >
                  {selectedSupplier.defaultMarginPercent > 0
                    ? `+${selectedSupplier.defaultMarginPercent}%`
                    : ''}
                  {selectedSupplier.defaultFixedMarkup > 0
                    ? ` +${selectedSupplier.defaultFixedMarkup} ₴`
                    : ''}
                  {!selectedSupplier.defaultMarginPercent && !selectedSupplier.defaultFixedMarkup
                    ? t('suppliers:noMarkup', { defaultValue: 'Без націнки' })
                    : ''}
                </Badge>
              </div>
            )}
          </div>

          {suppliers.length === 0 ? (
            <div
              data-testid="no-suppliers-warning"
              className="p-4 rounded-md border border-dashed border-border bg-muted/20 flex flex-col items-center text-center space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="size-8 rounded-md bg-muted border border-border/60 text-muted-foreground flex items-center justify-center">
                <Truck className="size-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground">
                  {t('suppliers:noSuppliersYet', { defaultValue: 'Постачальників ще не додано' })}
                </h4>
                <p className="text-2xs text-muted-foreground max-w-sm">
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
                  className="text-xs h-8 gap-1.5"
                  data-testid="wizard-create-supplier-btn"
                >
                  <Plus className="size-3.5" />
                  <span>
                    {t('suppliers:quickCreateSupplier', { defaultValue: 'Створити постачальника' })}
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
                    defaultValue: 'Оберіть постачальника зі списку…',
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
                      <span className="text-muted-foreground font-mono text-2xs">({s.code})</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
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

        {/* Supplier Sync Policy Notice */}
        <div
          data-testid="wizard-supplier-sync-policy-card"
          className="md:col-span-5 p-3 rounded-lg bg-card border border-border/60 flex items-start gap-2.5 text-xs"
        >
          <div className="size-7 rounded-md bg-muted border border-border/60 text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="size-3.5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="font-semibold text-foreground text-xs">
              {t('suppliers:supplierSyncPolicyTitle', {
                defaultValue: 'Політика синхронізації постачальника',
              })}
            </div>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              {t('suppliers:supplierSyncPolicyDesc', {
                defaultValue:
                  'Ціни та залишки синхронізуватимуться автоматично за правилами постачальника із захистом відредагованих товарів.',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Live Profit & Margin Simulator */}
      <WizardPricingSimulator supplier={selectedSupplier} analysis={analysis} />
    </div>
  );
}
