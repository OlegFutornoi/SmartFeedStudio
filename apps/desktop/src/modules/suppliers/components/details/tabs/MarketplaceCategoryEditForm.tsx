import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  type MarketplaceCategoryDto,
  type UpdateMarketplaceCategoryDto,
  parseMarketplaceCategoryUrl,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface MarketplaceCategoryEditFormProps {
  category: MarketplaceCategoryDto;
  onSave: (id: string, patch: UpdateMarketplaceCategoryDto) => Promise<void>;
  onCancel: () => void;
}

export const MarketplaceCategoryEditForm: React.FC<MarketplaceCategoryEditFormProps> = ({
  category,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [nameUk, setNameUk] = useState(category.nameUk);
  const [externalIdOrUrl, setExternalIdOrUrl] = useState(category.externalId);
  const [commissionPercent, setCommissionPercent] = useState(
    String(category.defaultCommissionPercent ?? 0),
  );
  const [fullPathUk, setFullPathUk] = useState(category.fullPathUk || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = externalIdOrUrl.trim();
    const rawName = nameUk.trim();
    if (!rawId || !rawName) return;

    setIsSaving(true);
    try {
      const parsed = parseMarketplaceCategoryUrl(rawId, category.marketplaceCode);
      await onSave(category.id, {
        nameUk: rawName,
        externalId: parsed?.externalId || rawId,
        url: parsed?.extractedUrl || category.url || null,
        defaultCommissionPercent: Number(commissionPercent) || 0,
        fullPathUk: fullPathUk.trim() || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2.5"
      data-testid="marketplace-category-edit-form"
    >
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <span className="text-xs font-semibold text-foreground">
          {t('suppliers:editCategoryTitle', { defaultValue: 'Редагувати категорію маркетплейсу' })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="size-6 p-0 text-muted-foreground hover:text-foreground"
          aria-label={t('common:cancel', { defaultValue: 'Скасувати' })}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="edit-category-name" className="text-2xs">
            {t('suppliers:editCategoryNameLabel', { defaultValue: 'Назва категорії (UK)' })}
          </Label>
          <Input
            id="edit-category-name"
            value={nameUk}
            onChange={(e) => setNameUk(e.target.value)}
            className="h-7 text-xs bg-background"
            data-testid="edit-category-name-input"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="edit-category-id" className="text-2xs">
              {t('suppliers:editCategoryIdLabel', {
                attr: category.xmlAttributeName,
                defaultValue: `Код (${category.xmlAttributeName}) або URL`,
              })}
            </Label>
            <Input
              id="edit-category-id"
              value={externalIdOrUrl}
              onChange={(e) => setExternalIdOrUrl(e.target.value)}
              className="h-7 text-xs font-mono bg-background"
              data-testid="edit-category-id-input"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-category-commission" className="text-2xs">
              {t('suppliers:editCategoryCommissionLabel', { defaultValue: 'Комісія (%)' })}
            </Label>
            <Input
              id="edit-category-commission"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(e.target.value)}
              className="h-7 text-xs font-mono text-right bg-background"
              data-testid="edit-category-commission-input"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="edit-category-path" className="text-2xs">
            {t('suppliers:editCategoryPathLabel', {
              defaultValue: 'Повний шлях у дереві (опціонально)',
            })}
          </Label>
          <Input
            id="edit-category-path"
            value={fullPathUk}
            onChange={(e) => setFullPathUk(e.target.value)}
            placeholder={t('suppliers:editCategoryPathPlaceholder', {
              defaultValue: 'Каталог > Розділ > Підрозділ',
            })}
            className="h-7 text-xs bg-background"
            data-testid="edit-category-path-input"
          />
        </div>
      </div>

      <div className="flex justify-end gap-1.5 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          {t('common:cancel', { defaultValue: 'Скасувати' })}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSaving || !nameUk.trim() || !externalIdOrUrl.trim()}
          className="h-7 text-xs gap-1.5"
          data-testid="edit-category-submit-btn"
        >
          <Save className="size-3" />
          {t('common:save', { defaultValue: 'Зберегти' })}
        </Button>
      </div>
    </form>
  );
};
