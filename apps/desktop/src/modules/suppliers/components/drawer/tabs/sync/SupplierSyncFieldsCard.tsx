import React from 'react';
import {
  ShieldCheck,
  Image,
  FileText,
  Sliders,
  Type,
  FolderTree,
  Barcode,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/i18n';
import type { SupplierSyncSettingDto, UpdateSupplierSyncSettingDto } from '@smartfeed/shared';
import {
  ImageSyncMode,
  DescriptionSyncMode,
  AttributesSyncMode,
  TitleSyncMode,
  CategorySyncMode,
  BarcodeSyncMode,
} from '@smartfeed/shared';
import { SupplierSyncPresets } from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncPresets';
import {
  SupplierSyncFieldItem,
  type SelectOption,
} from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncFieldItem';

interface SupplierSyncFieldsCardProps {
  settings: SupplierSyncSettingDto;
  onChange: (patch: UpdateSupplierSyncSettingDto) => void;
}

export const SupplierSyncFieldsCard: React.FC<SupplierSyncFieldsCardProps> = ({
  settings,
  onChange,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const imageOptions: SelectOption[] = [
    {
      value: ImageSyncMode.DO_NOT_UPDATE,
      label: t('suppliers:modeImageDoNotUpdate', {
        defaultValue: 'Захистити власні фото (НЕ оновлювати)',
      }),
      badgeType: 'protected',
    },
    {
      value: ImageSyncMode.ADD_MISSING,
      label: t('suppliers:modeImageAddMissing', {
        defaultValue: 'Додавати фото тільки якщо відсутні',
      }),
      badgeType: 'append',
    },
    {
      value: ImageSyncMode.OVERWRITE,
      label: t('suppliers:modeImageOverwrite', {
        defaultValue: 'Перезаписувати галерею з фіду',
      }),
      badgeType: 'overwrite',
    },
  ];

  const descOptions: SelectOption[] = [
    {
      value: DescriptionSyncMode.DO_NOT_UPDATE,
      label: t('suppliers:modeDescDoNotUpdate', {
        defaultValue: 'Захистити кастомний опис (НЕ затирати)',
      }),
      badgeType: 'protected',
    },
    {
      value: DescriptionSyncMode.FILL_EMPTY_ONLY,
      label: t('suppliers:modeDescFillEmpty', {
        defaultValue: 'Заповнювати опис тільки якщо порожній',
      }),
      badgeType: 'append',
    },
    {
      value: DescriptionSyncMode.OVERWRITE,
      label: t('suppliers:modeDescOverwrite', {
        defaultValue: 'Перезаписувати описом з фіду',
      }),
      badgeType: 'overwrite',
    },
  ];

  const attrOptions: SelectOption[] = [
    {
      value: AttributesSyncMode.DO_NOT_UPDATE,
      label: t('suppliers:modeAttrDoNotUpdate', {
        defaultValue: 'Захистити характеристики (НЕ змінювати)',
      }),
      badgeType: 'protected',
    },
    {
      value: AttributesSyncMode.ADD_NEW_ONLY,
      label: t('suppliers:modeAttrAddNewOnly', {
        defaultValue: 'Додавати тільки нові характеристики',
      }),
      badgeType: 'append',
    },
    {
      value: AttributesSyncMode.OVERWRITE,
      label: t('suppliers:modeAttrOverwrite', {
        defaultValue: 'Повний перезапис характеристик з фіду',
      }),
      badgeType: 'overwrite',
    },
  ];

  const titleOptions: SelectOption[] = [
    {
      value: TitleSyncMode.DO_NOT_UPDATE,
      label: t('suppliers:modeTitleDoNotUpdate', {
        defaultValue: 'Захистити SEO-назву (НЕ оновлювати)',
      }),
      badgeType: 'protected',
    },
    {
      value: TitleSyncMode.OVERWRITE,
      label: t('suppliers:modeTitleOverwrite', {
        defaultValue: 'Перезаписувати назвою з фіду',
      }),
      badgeType: 'overwrite',
    },
  ];

  const categoryOptions: SelectOption[] = [
    {
      value: CategorySyncMode.KEEP_MANUAL_MAPPING,
      label: t('suppliers:modeCatKeepManual', {
        defaultValue: 'Зберігати власну прив’язку до категорій',
      }),
      badgeType: 'protected',
    },
    {
      value: CategorySyncMode.OVERWRITE_WITH_FEED,
      label: t('suppliers:modeCatOverwriteFeed', {
        defaultValue: 'Перезаписувати категорією постачальника',
      }),
      badgeType: 'overwrite',
    },
  ];

  const barcodeOptions: SelectOption[] = [
    {
      value: BarcodeSyncMode.DO_NOT_UPDATE,
      label: t('suppliers:modeBarcodeDoNotUpdate', { defaultValue: 'Не оновлювати з фіду' }),
      badgeType: 'protected',
    },
    {
      value: BarcodeSyncMode.FILL_EMPTY_ONLY,
      label: t('suppliers:modeBarcodeFillEmpty', {
        defaultValue: 'Заповнювати якщо відсутній',
      }),
      badgeType: 'append',
    },
    {
      value: BarcodeSyncMode.OVERWRITE,
      label: t('suppliers:modeBarcodeOverwrite', { defaultValue: 'Перезаписувати з фіду' }),
      badgeType: 'overwrite',
    },
  ];

  return (
    <Card className="border-border/80 shadow-xs" data-testid="supplier-sync-fields-card">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>
                {t('suppliers:protectEditedProductsTitle', {
                  defaultValue: 'Захист контенту та ручних правок',
                })}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              {t('suppliers:protectEditedProductsDesc', {
                defaultValue:
                  'Оновлюються виключно ціни та залишки. Власні фото, описи та характеристики не затираються.',
              })}
            </CardDescription>
          </div>
          <Switch
            checked={settings.protectEditedProducts}
            onCheckedChange={(checked) => onChange({ protectEditedProducts: checked })}
            data-testid="toggle-protect-edited-products"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Quick Presets Bar */}
        <SupplierSyncPresets settings={settings} onApplyPreset={onChange} />

        {/* Commercial Toggles: Price and Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <DollarSign className="size-3.5 text-primary shrink-0" />
              <div className="text-xs font-medium text-foreground truncate">
                {t('suppliers:syncPricesTitle', { defaultValue: 'Оновлювати ціни' })}
              </div>
            </div>
            <Switch
              checked={settings.syncPrices}
              onCheckedChange={(checked) => onChange({ syncPrices: checked })}
              data-testid="toggle-sync-prices"
            />
          </div>

          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Boxes className="size-3.5 text-primary shrink-0" />
              <div className="text-xs font-medium text-foreground truncate">
                {t('suppliers:syncStocksTitle', { defaultValue: 'Оновлювати наявність / залишки' })}
              </div>
            </div>
            <Switch
              checked={settings.syncStocks}
              onCheckedChange={(checked) => onChange({ syncStocks: checked })}
              data-testid="toggle-sync-stocks"
            />
          </div>
        </div>

        {/* Granular Field Modes: Photos, Descriptions, Attributes, Titles, Categories, Barcodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <SupplierSyncFieldItem
            icon={Image}
            label={t('suppliers:imageSyncModeLabel', { defaultValue: 'Фотографії товару' })}
            value={settings.imageSyncMode}
            options={imageOptions}
            onValueChange={(val) => onChange({ imageSyncMode: val as ImageSyncMode })}
            dataTestId="select-image-sync-mode"
          />

          <SupplierSyncFieldItem
            icon={FileText}
            label={t('suppliers:descriptionSyncModeLabel', { defaultValue: 'Опис товару' })}
            value={settings.descriptionSyncMode}
            options={descOptions}
            onValueChange={(val) => onChange({ descriptionSyncMode: val as DescriptionSyncMode })}
            dataTestId="select-description-sync-mode"
          />

          <SupplierSyncFieldItem
            icon={Sliders}
            label={t('suppliers:attributesSyncModeLabel', {
              defaultValue: 'Характеристики та атрибути',
            })}
            value={settings.attributesSyncMode}
            options={attrOptions}
            onValueChange={(val) => onChange({ attributesSyncMode: val as AttributesSyncMode })}
            dataTestId="select-attributes-sync-mode"
          />

          <SupplierSyncFieldItem
            icon={Type}
            label={t('suppliers:titleSyncModeLabel', { defaultValue: 'Назва товару (Title)' })}
            value={settings.titleSyncMode}
            options={titleOptions}
            onValueChange={(val) => onChange({ titleSyncMode: val as TitleSyncMode })}
            dataTestId="select-title-sync-mode"
          />

          <SupplierSyncFieldItem
            icon={FolderTree}
            label={t('suppliers:categorySyncModeLabel', { defaultValue: 'Категорія товару' })}
            value={settings.categorySyncMode}
            options={categoryOptions}
            onValueChange={(val) => onChange({ categorySyncMode: val as CategorySyncMode })}
            dataTestId="select-category-sync-mode"
          />

          <SupplierSyncFieldItem
            icon={Barcode}
            label={t('suppliers:barcodeSyncModeLabel', { defaultValue: 'Артикул та штрихкод' })}
            value={settings.barcodeSyncMode}
            options={barcodeOptions}
            onValueChange={(val) => onChange({ barcodeSyncMode: val as BarcodeSyncMode })}
            dataTestId="select-barcode-sync-mode"
          />
        </div>
      </CardContent>
    </Card>
  );
};
