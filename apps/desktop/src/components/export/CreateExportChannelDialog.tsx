import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Store, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ExportChannelDto,
  CreateExportChannelDto,
  FeedFormat,
  simulateFullPricing,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { MarketplacePresetsList, MARKETPLACES } from './MarketplacePresetsList';
import { MarginEconomicsSimulator } from './MarginEconomicsSimulator';

interface CreateExportChannelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateExportChannelDto) => Promise<void>;
  initialData?: ExportChannelDto | null;
  catalogs?: Array<{ id: string; name: string }>;
}

export function CreateExportChannelDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  catalogs = [],
}: CreateExportChannelDialogProps) {
  const { t } = useTranslation(['catalogs', 'common']);

  const [name, setName] = useState('');
  const [marketplaceCode, setMarketplaceCode] = useState('ROZETKA');
  const [feedFormat, setFeedFormat] = useState<FeedFormat>(FeedFormat.XML_ROZETKA);
  const [commissionPercent, setCommissionPercent] = useState<string>('15');
  const [extraFixedCost, setExtraFixedCost] = useState<string>('0');
  const [applyReverseMarkup, setApplyReverseMarkup] = useState<boolean>(true);
  const [catalogId, setCatalogId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulator Inputs
  const [simCostPrice, setSimCostPrice] = useState<number>(1000);
  const [simSupplierMargin, setSimSupplierMargin] = useState<number>(25);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setMarketplaceCode(initialData.marketplaceCode);
      setFeedFormat(initialData.feedFormat);
      setCommissionPercent(String(initialData.commissionPercent));
      setExtraFixedCost(String(initialData.extraFixedCost));
      setApplyReverseMarkup(initialData.applyReverseMarkup);
      setCatalogId(initialData.catalogId || '');
    } else {
      setName('Rozetka — Основний фід');
      setMarketplaceCode('ROZETKA');
      setFeedFormat(FeedFormat.XML_ROZETKA);
      setCommissionPercent('15');
      setExtraFixedCost('0');
      setApplyReverseMarkup(true);
      setCatalogId(catalogs[0]?.id || '');
    }
  }, [initialData, isOpen, catalogs]);

  const handleMarketplaceChange = (code: string) => {
    setMarketplaceCode(code);
    const m = MARKETPLACES.find((x) => x.code === code);
    if (m) {
      setFeedFormat(m.defaultFormat);
      setCommissionPercent(String(m.defaultCommission));
      if (!initialData) {
        setName(`${m.name.split(' ')[0]} — Каталог товарів`);
      }
    }
  };

  const simulation = useMemo(() => {
    return simulateFullPricing({
      costPrice: simCostPrice || 0,
      supplierMarginPercent: simSupplierMargin || 0,
      supplierFixedMarkup: 0,
      marketplaceCommissionPercent: Number(commissionPercent) || 0,
      marketplaceExtraFixedCost: Number(extraFixedCost) || 0,
      applyReverseMarkup,
    });
  }, [simCostPrice, simSupplierMargin, commissionPercent, extraFixedCost, applyReverseMarkup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        marketplaceCode,
        feedFormat,
        commissionPercent: Number(commissionPercent) || 0,
        extraFixedCost: Number(extraFixedCost) || 0,
        applyReverseMarkup,
        catalogId: catalogId || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося зберегти канал експорту';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border/80 rounded-2xl shadow-2xl p-6 flex flex-col justify-between">
        {/* 100% Solid Sticky Header */}
        <div className="sticky top-0 bg-card z-10 pb-4 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {initialData
                  ? 'Редагувати канал експорту'
                  : 'Створити канал експорту для маркетплейсу'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Генерація персоналізованого XML/CSV фіду зі зворотною націнкою під комісію сайту
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="size-4" />
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <MarketplacePresetsList
            selectedCode={marketplaceCode}
            onSelect={handleMarketplaceChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-foreground">Назва каналу експорту</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="напр. Rozetka Одяг"
                required
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs text-foreground">Вихідний формат фіду</Label>
              <select
                value={feedFormat}
                onChange={(e) => setFeedFormat(e.target.value as FeedFormat)}
                className="w-full h-9 text-xs rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
              >
                <option value={FeedFormat.XML_ROZETKA}>
                  XML (Формат Rozetka / Prom / Epicentr)
                </option>
                <option value={FeedFormat.YML_PROM}>YML (Yandex / Prom XML)</option>
                <option value={FeedFormat.CSV}>CSV (Експорт для таблиць / Hotline)</option>
                <option value={FeedFormat.XML_GENERIC}>Generic XML</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-foreground">Комісія маркетплейсу (%)</Label>
              <Input
                type="number"
                min="0"
                max="90"
                step="0.1"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="mt-1 h-9 text-xs font-mono"
              />
            </div>

            <div>
              <Label className="text-xs text-foreground">Додаткові витрати на одиницю (₴)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={extraFixedCost}
                onChange={(e) => setExtraFixedCost(e.target.value)}
                placeholder="0"
                className="mt-1 h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start gap-3">
            <input
              type="checkbox"
              id="reverseMarkupCheck"
              checked={applyReverseMarkup}
              onChange={(e) => setApplyReverseMarkup(e.target.checked)}
              className="mt-1 rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <div className="space-y-0.5">
              <label
                htmlFor="reverseMarkupCheck"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Автоматична зворотна націнка (Reverse Markup)
              </label>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Формула: Ціна на полиці = (БазоваЦіна + Витрати) / (1 - Комісія%). Зберігає 100%
                вашого планового прибутку.
              </p>
            </div>
          </div>

          <MarginEconomicsSimulator
            simCostPrice={simCostPrice}
            simSupplierMargin={simSupplierMargin}
            commissionPercent={commissionPercent}
            extraFixedCost={extraFixedCost}
            applyReverseMarkup={applyReverseMarkup}
            simulation={simulation}
            onCostPriceChange={setSimCostPrice}
            onSupplierMarginChange={setSimSupplierMargin}
          />

          {/* 100% Solid Sticky Footer */}
          <div className="sticky bottom-0 bg-card z-10 pt-4 border-t border-border/80 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs px-4">
              {t('common:cancel', { defaultValue: 'Скасувати' })}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              data-testid="save-export-channel-btn"
              className="h-9 text-xs px-5 font-semibold"
            >
              {isLoading ? 'Збереження...' : initialData ? 'Оновити канал' : 'Підключити канал'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
