import React from 'react';
import { PackageX, Sparkles } from 'lucide-react';
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
import { SyncMissingProductsAction, SyncNewProductsAction } from '@smartfeed/shared';

interface SupplierSyncAssortmentCardProps {
  settings: SupplierSyncSettingDto;
  onChange: (patch: UpdateSupplierSyncSettingDto) => void;
}

export const SupplierSyncAssortmentCard: React.FC<SupplierSyncAssortmentCardProps> = ({
  settings,
  onChange,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <Card className="border-border/80 shadow-xs" data-testid="supplier-sync-assortment-card">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <PackageX className="size-4 text-primary" />
          {t('suppliers:assortmentCardTitle', { defaultValue: 'Політика асортименту та новинок' })}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('suppliers:assortmentCardDesc', {
            defaultValue:
              'Стандарти Prom.ua та Rozetka для товарів, що зникли з фіду постачальника або з’явилися вперше',
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Missing Products Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <PackageX className="size-3.5 text-muted-foreground" />
              <span>
                {t('suppliers:missingProductsLabel', {
                  defaultValue: 'Якщо товар зник із фіду постачальника',
                })}
              </span>
            </Label>
            <Select
              value={settings.missingProductsAction}
              onValueChange={(val) =>
                onChange({ missingProductsAction: val as SyncMissingProductsAction })
              }
            >
              <SelectTrigger
                className="h-8 text-xs bg-background"
                data-testid="select-missing-products-action"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SyncMissingProductsAction.OUT_OF_STOCK}>
                  {t('suppliers:missingOutOfStock', {
                    defaultValue: 'Позначити «Немає в наявності» (Стандарт маркетплейсів)',
                  })}
                </SelectItem>
                <SelectItem value={SyncMissingProductsAction.DEACTIVATE}>
                  {t('suppliers:missingDeactivate', {
                    defaultValue: 'Зняти з публікації (Деактивувати)',
                  })}
                </SelectItem>
                <SelectItem value={SyncMissingProductsAction.DO_NOTHING}>
                  {t('suppliers:missingDoNothing', { defaultValue: 'Не змінювати стан товару' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Products Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-muted-foreground" />
              <span>
                {t('suppliers:newProductsLabel', {
                  defaultValue: 'Нові товари у фіді постачальника',
                })}
              </span>
            </Label>
            <Select
              value={settings.newProductsAction}
              onValueChange={(val) => onChange({ newProductsAction: val as SyncNewProductsAction })}
            >
              <SelectTrigger
                className="h-8 text-xs bg-background"
                data-testid="select-new-products-action"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SyncNewProductsAction.AUTO_PUBLISH}>
                  {t('suppliers:newAutoPublish', {
                    defaultValue: 'Одразу створювати та активувати',
                  })}
                </SelectItem>
                <SelectItem value={SyncNewProductsAction.CREATE_DRAFT}>
                  {t('suppliers:newCreateDraft', {
                    defaultValue: 'Створювати як чернетку (Для модерації)',
                  })}
                </SelectItem>
                <SelectItem value={SyncNewProductsAction.IGNORE}>
                  {t('suppliers:newIgnore', { defaultValue: 'Ігнорувати нові товари' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
