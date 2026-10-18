import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  type MarketplaceCategoryDto,
  type CreateMarketplaceCategoryDto,
  parseMarketplaceCategoryUrl,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface MarketplaceCategoryCustomFormProps {
  defaultName?: string;
  defaultIdOrUrl?: string;
  marketplaceCode: string;
  xmlAttributeName: string;
  onCreateAndSelect: (payload: CreateMarketplaceCategoryDto) => Promise<MarketplaceCategoryDto>;
}

export const MarketplaceCategoryCustomForm: React.FC<MarketplaceCategoryCustomFormProps> = ({
  defaultName = '',
  defaultIdOrUrl = '',
  marketplaceCode,
  xmlAttributeName,
  onCreateAndSelect,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [customName, setCustomName] = useState(defaultName || '');
  const [customIdOrUrl, setCustomIdOrUrl] = useState(defaultIdOrUrl || '');
  const [customCommission, setCustomCommission] = useState('12');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCustomName(defaultName || '');
  }, [defaultName]);

  useEffect(() => {
    if (defaultIdOrUrl) setCustomIdOrUrl(defaultIdOrUrl);
  }, [defaultIdOrUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = customIdOrUrl.trim();
    const rawName = customName.trim();
    if (!rawId || !rawName) return;

    setIsSaving(true);
    try {
      const parsed = parseMarketplaceCategoryUrl(rawId, marketplaceCode);
      await onCreateAndSelect({
        marketplaceCode: parsed?.marketplaceCode || marketplaceCode,
        externalId: parsed?.externalId || rawId,
        xmlAttributeName: parsed?.xmlAttributeName || xmlAttributeName,
        nameUk: rawName,
        url: parsed?.extractedUrl || null,
        defaultCommissionPercent: Number(customCommission) || 0,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-2.5 rounded-lg border border-border/80 bg-muted/30 space-y-2"
      data-testid="picker-custom-form"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-5 space-y-1">
          <Label htmlFor="picker-custom-name" className="text-2xs">
            {t('suppliers:pickerCustomNameLabel', { defaultValue: 'Назва на МП' })}
          </Label>
          <Input
            id="picker-custom-name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={t('suppliers:pickerCustomNamePlaceholder', {
              defaultValue: 'Зарядні станції',
            })}
            className="h-7 text-xs bg-background"
            data-testid="picker-custom-name-input"
          />
        </div>
        <div className="sm:col-span-5 space-y-1">
          <Label htmlFor="picker-custom-id" className="text-2xs">
            {t('suppliers:pickerCustomIdLabel', {
              attr: xmlAttributeName,
              defaultValue: `Код (${xmlAttributeName}) або URL`,
            })}
          </Label>
          <Input
            id="picker-custom-id"
            value={customIdOrUrl}
            onChange={(e) => setCustomIdOrUrl(e.target.value)}
            placeholder={t('suppliers:pickerCustomIdPlaceholder', {
              defaultValue: '4674585 або URL',
            })}
            className="h-7 text-xs font-mono bg-background"
            data-testid="picker-custom-id-input"
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="picker-custom-commission" className="text-2xs">
            {t('suppliers:pickerCustomCommissionLabel', { defaultValue: 'Комісія (%)' })}
          </Label>
          <Input
            id="picker-custom-commission"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={customCommission}
            onChange={(e) => setCustomCommission(e.target.value)}
            className="h-7 text-xs font-mono text-right bg-background"
            data-testid="picker-custom-commission-input"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={isSaving || !customName.trim() || !customIdOrUrl.trim()}
          className="h-7 text-xs gap-1.5"
          data-testid="picker-save-custom-btn"
        >
          <Sparkles className="size-3" />
          {t('suppliers:pickerSaveAndSelectBtn', { defaultValue: 'Додати та привʼязати' })}
        </Button>
      </div>
    </form>
  );
};
