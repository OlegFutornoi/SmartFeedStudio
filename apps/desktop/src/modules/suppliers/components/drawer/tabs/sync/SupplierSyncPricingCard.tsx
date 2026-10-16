import React from 'react';
import { DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import type { SupplierSyncSettingDto, UpdateSupplierSyncSettingDto } from '@smartfeed/shared';
import { SyncPriceSource, SyncZeroPriceAction } from '@smartfeed/shared';

interface SupplierSyncPricingCardProps {
  settings: SupplierSyncSettingDto;
  onChange: (patch: UpdateSupplierSyncSettingDto) => void;
}

export const SupplierSyncPricingCard: React.FC<SupplierSyncPricingCardProps> = ({
  settings,
  onChange,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <Card className="border-border/80 shadow-xs" data-testid="supplier-sync-pricing-card">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="size-4 text-primary" />
          {t('suppliers:pricingCardTitle', { defaultValue: 'Ціноутворення та комерційні правила' })}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('suppliers:pricingCardDesc', {
            defaultValue: 'Вибір базової ціни з фіду та правила захисту маржі при синхронізації',
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Price Source */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Percent className="size-3.5 text-primary" />
              <span>
                {t('suppliers:priceSourceLabel', { defaultValue: 'Джерело ціни з фіду' })}
              </span>
            </Label>
            <Select
              value={settings.priceSource}
              onValueChange={(val) => onChange({ priceSource: val as SyncPriceSource })}
            >
              <SelectTrigger
                className="h-8 text-xs bg-background"
                data-testid="select-price-source"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SyncPriceSource.WHOLESALE}>
                  {t('suppliers:priceSourceWholesale', {
                    defaultValue: 'Оптова ціна + власна націнка',
                  })}
                </SelectItem>
                <SelectItem value={SyncPriceSource.RRP}>
                  {t('suppliers:priceSourceRrp', { defaultValue: 'Рекомендована роздрібна (РРЦ)' })}
                </SelectItem>
                <SelectItem value={SyncPriceSource.MAX_OF_BOTH}>
                  {t('suppliers:priceSourceMaxOfBoth', {
                    defaultValue: 'Більша з двох (Захист маржі)',
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zero Price Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-muted-foreground" />
              <span>
                {t('suppliers:zeroPriceActionLabel', {
                  defaultValue: 'Дія при нульовій або відсутній ціні',
                })}
              </span>
            </Label>
            <Select
              value={settings.zeroPriceAction}
              onValueChange={(val) => onChange({ zeroPriceAction: val as SyncZeroPriceAction })}
            >
              <SelectTrigger
                className="h-8 text-xs bg-background"
                data-testid="select-zero-price-action"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SyncZeroPriceAction.OUT_OF_STOCK}>
                  {t('suppliers:actionOutOfStock', {
                    defaultValue: 'Позначити «Немає в наявності»',
                  })}
                </SelectItem>
                <SelectItem value={SyncZeroPriceAction.SKIP}>
                  {t('suppliers:actionSkip', { defaultValue: 'Пропустити (не змінювати товар)' })}
                </SelectItem>
                <SelectItem value={SyncZeroPriceAction.DEACTIVATE}>
                  {t('suppliers:actionDeactivate', { defaultValue: 'Деактивувати товар' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
