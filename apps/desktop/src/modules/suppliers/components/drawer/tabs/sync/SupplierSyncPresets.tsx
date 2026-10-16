import React from 'react';
import { ShieldCheck, Sparkles, RefreshCcw, SlidersHorizontal } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface SupplierSyncPresetsProps {
  settings: SupplierSyncSettingDto;
  onApplyPreset: (patch: UpdateSupplierSyncSettingDto) => void;
}

export type SyncPresetType = 'SAFE_MODE' | 'SMART_MERGE' | 'FULL_OVERWRITE' | 'CUSTOM';

export const detectActivePreset = (s: SupplierSyncSettingDto): SyncPresetType => {
  const isSafe =
    s.protectEditedProducts === true &&
    s.imageSyncMode === ImageSyncMode.DO_NOT_UPDATE &&
    s.descriptionSyncMode === DescriptionSyncMode.DO_NOT_UPDATE &&
    s.attributesSyncMode === AttributesSyncMode.DO_NOT_UPDATE &&
    s.titleSyncMode === TitleSyncMode.DO_NOT_UPDATE;

  if (isSafe) return 'SAFE_MODE';

  const isSmart =
    s.protectEditedProducts === true &&
    s.imageSyncMode === ImageSyncMode.ADD_MISSING &&
    s.descriptionSyncMode === DescriptionSyncMode.FILL_EMPTY_ONLY &&
    s.attributesSyncMode === AttributesSyncMode.ADD_NEW_ONLY &&
    s.titleSyncMode === TitleSyncMode.DO_NOT_UPDATE;

  if (isSmart) return 'SMART_MERGE';

  const isOverwrite =
    s.protectEditedProducts === false &&
    s.imageSyncMode === ImageSyncMode.OVERWRITE &&
    s.descriptionSyncMode === DescriptionSyncMode.OVERWRITE &&
    s.attributesSyncMode === AttributesSyncMode.OVERWRITE &&
    s.titleSyncMode === TitleSyncMode.OVERWRITE;

  if (isOverwrite) return 'FULL_OVERWRITE';

  return 'CUSTOM';
};

export const SupplierSyncPresets: React.FC<SupplierSyncPresetsProps> = ({
  settings,
  onApplyPreset,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const activePreset = detectActivePreset(settings);

  const handlePresetChange = (val: string) => {
    if (val === 'SAFE_MODE') {
      onApplyPreset({
        protectEditedProducts: true,
        syncPrices: true,
        syncStocks: true,
        imageSyncMode: ImageSyncMode.DO_NOT_UPDATE,
        descriptionSyncMode: DescriptionSyncMode.DO_NOT_UPDATE,
        attributesSyncMode: AttributesSyncMode.DO_NOT_UPDATE,
        titleSyncMode: TitleSyncMode.DO_NOT_UPDATE,
        categorySyncMode: CategorySyncMode.KEEP_MANUAL_MAPPING,
        barcodeSyncMode: BarcodeSyncMode.DO_NOT_UPDATE,
      });
    } else if (val === 'SMART_MERGE') {
      onApplyPreset({
        protectEditedProducts: true,
        syncPrices: true,
        syncStocks: true,
        imageSyncMode: ImageSyncMode.ADD_MISSING,
        descriptionSyncMode: DescriptionSyncMode.FILL_EMPTY_ONLY,
        attributesSyncMode: AttributesSyncMode.ADD_NEW_ONLY,
        titleSyncMode: TitleSyncMode.DO_NOT_UPDATE,
        categorySyncMode: CategorySyncMode.KEEP_MANUAL_MAPPING,
        barcodeSyncMode: BarcodeSyncMode.FILL_EMPTY_ONLY,
      });
    } else if (val === 'FULL_OVERWRITE') {
      onApplyPreset({
        protectEditedProducts: false,
        syncPrices: true,
        syncStocks: true,
        imageSyncMode: ImageSyncMode.OVERWRITE,
        descriptionSyncMode: DescriptionSyncMode.OVERWRITE,
        attributesSyncMode: AttributesSyncMode.OVERWRITE,
        titleSyncMode: TitleSyncMode.OVERWRITE,
        categorySyncMode: CategorySyncMode.OVERWRITE_WITH_FEED,
        barcodeSyncMode: BarcodeSyncMode.OVERWRITE,
      });
    }
  };

  return (
    <div className="space-y-2" data-testid="supplier-sync-presets">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <SlidersHorizontal className="size-3.5 text-primary" />
          <span>
            {t('suppliers:presetsHeading', { defaultValue: 'Швидкі готові сценарії захисту' })}
          </span>
        </Label>
        {activePreset === 'CUSTOM' && (
          <span className="text-3xs text-muted-foreground italic">
            {t('suppliers:presetCustomActive', { defaultValue: 'Власна комбінація параметрів' })}
          </span>
        )}
      </div>

      <Tabs value={activePreset} onValueChange={handlePresetChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/60 p-1 rounded-lg">
          <TabsTrigger
            value="SAFE_MODE"
            className="text-xs h-7 gap-1.5 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            data-testid="preset-safe-mode"
          >
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span className="truncate">
              {t('suppliers:presetSafeModeTitle', { defaultValue: 'Захист контенту' })}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="SMART_MERGE"
            className="text-xs h-7 gap-1.5 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            data-testid="preset-smart-merge"
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span className="truncate">
              {t('suppliers:presetSmartMergeTitle', { defaultValue: 'Розумне об’єднання' })}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="FULL_OVERWRITE"
            className="text-xs h-7 gap-1.5 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs transition-all"
            data-testid="preset-full-overwrite"
          >
            <RefreshCcw className="size-3.5 shrink-0" />
            <span className="truncate">
              {t('suppliers:presetOverwriteTitle', { defaultValue: 'Повний перезапис' })}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="p-2.5 rounded-md bg-muted/40 border border-border/60 text-2xs text-muted-foreground leading-relaxed">
        {activePreset === 'SAFE_MODE' && (
          <p>
            <strong className="text-foreground font-medium">
              {t('suppliers:presetSafeModeTitle', { defaultValue: 'Захист контенту' })}:
            </strong>{' '}
            {t('suppliers:presetSafeModeDesc', {
              defaultValue: 'Тільки ціни і залишок. Фото, описи та характеристики недоторкані.',
            })}
          </p>
        )}
        {activePreset === 'SMART_MERGE' && (
          <p>
            <strong className="text-foreground font-medium">
              {t('suppliers:presetSmartMergeTitle', { defaultValue: 'Розумне об’єднання' })}:
            </strong>{' '}
            {t('suppliers:presetSmartMergeDesc', {
              defaultValue: 'Додавати нові фото/властивості і заповнювати тільки порожні поля.',
            })}
          </p>
        )}
        {activePreset === 'FULL_OVERWRITE' && (
          <p>
            <strong className="text-foreground font-medium">
              {t('suppliers:presetOverwriteTitle', { defaultValue: 'Повний перезапис' })}:
            </strong>{' '}
            {t('suppliers:presetOverwriteDesc', {
              defaultValue: 'Повна заміна всіх полів із фіду постачальника (якщо фід еталонний).',
            })}
          </p>
        )}
        {activePreset === 'CUSTOM' && (
          <p>
            <strong className="text-foreground font-medium">
              {t('suppliers:presetCustomActive', { defaultValue: 'Власна комбінація параметрів' })}:
            </strong>{' '}
            {t('suppliers:fieldsProtectionDesc', {
              defaultValue: 'Гнучкий контроль над кожним параметром у таблиці нижче.',
            })}
          </p>
        )}
      </div>
    </div>
  );
};
