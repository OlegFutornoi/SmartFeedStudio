import { SupplierDto } from '@smartfeed/shared';
import { Label } from '@/components/ui/label';
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
          className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-in fade-in duration-150"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Supplier Select / Empty State */}
      <div className="space-y-1.5">
        <Label className="text-xs text-foreground font-medium">
          {t('suppliers:selectSupplierLabel', { defaultValue: 'Оберіть постачальника' })}
        </Label>

        {suppliers.length === 0 ? (
          <div
            data-testid="no-suppliers-warning"
            className="p-5 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center text-center space-y-3 animate-in fade-in duration-150"
          >
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="size-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">
                {t('suppliers:noSuppliersYet', { defaultValue: 'Постачальників ще не додано' })}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
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
                    <span className="text-muted-foreground font-mono text-2xs">({s.code})</span>
                    <span className="text-muted-foreground text-xs">
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

      {/* Interactive Live Profit & Margin Simulator */}
      <WizardPricingSimulator supplier={selectedSupplier} analysis={analysis} />

      {/* Supplier Sync Policy Notice */}
      <div
        data-testid="wizard-supplier-sync-policy-card"
        className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-3 text-xs"
      >
        <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">
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
  );
}
