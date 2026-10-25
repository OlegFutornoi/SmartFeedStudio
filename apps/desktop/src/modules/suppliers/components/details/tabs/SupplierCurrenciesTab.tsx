import React from 'react';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { CurrencyCode, getCurrencySymbol } from '@smartfeed/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompactBankRatesTable } from '@/modules/suppliers/components/details/tabs/currencies/CompactBankRatesTable';
import { SupplierCurrencyFormCard } from '@/modules/suppliers/components/details/tabs/currencies/SupplierCurrencyFormCard';
import { SupplierCurrencyPreviewCard } from '@/modules/suppliers/components/details/tabs/currencies/SupplierCurrencyPreviewCard';
import { useSupplierCurrenciesState } from '@/modules/suppliers/components/details/tabs/currencies/useSupplierCurrenciesState';
import { useTranslation } from '@/i18n';
import type { FeedSourceItemDto } from '@/lib/api/feed-sources';

interface SupplierCurrenciesTabProps {
  feed: FeedSourceItemDto;
  onBack?: () => void;
  onRefreshFeed?: () => void;
}

export const SupplierCurrenciesTab: React.FC<SupplierCurrenciesTabProps> = ({
  feed,
  onBack,
  onRefreshFeed,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const {
    baseCurrency,
    handleBaseCurrencyChange,
    exchangeMode,
    handleExchangeModeChange,
    activeRate,
    effectiveRate,
    setManualRate,
    bufferPercent,
    setBufferPercent,
    roundingMode,
    setRoundingMode,
    customRoundingRules,
    handleAddCustomRoundingRule,
    handleDeleteCustomRoundingRule,
    selectedBankId,
    handleSelectBankRate,
    handleBankRatesSynced,
    isFetchingRates,
    loadRates,
    isSaving,
    isDirty,
    handleResetChanges,
    handleSaveCurrencyConfig,
  } = useSupplierCurrenciesState({ feed, onRefreshFeed });

  const symbol = getCurrencySymbol(baseCurrency);

  return (
    <div className="space-y-2.5" data-testid="supplier-currencies-tab">
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 -ml-2"
            data-testid="back-to-feeds-list-btn"
          >
            <ArrowLeft className="size-3.5" />
            {t('suppliers:backToFeedsList', { defaultValue: 'Назад до списку фідів' })}
          </Button>
          <div className="text-xs font-medium text-muted-foreground">{feed.name}</div>
        </div>
      )}
      {/* Top Conversion Formula Banner */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-muted/20 text-xs"
        data-testid="currency-formula-banner"
      >
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <ArrowRightLeft className="size-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">
            {t('suppliers:currencyFormulaHint', {
              defaultValue:
                'Порядок конвертації: 1. Ціна у валюті прайсу × 2. Ефективний курс (Курс + Буфер %) ➔ 3. Округлення = Собівартість (₴)',
            })}
          </span>
        </div>

        <Badge
          variant="outline"
          className="text-2xs font-mono tabular-nums px-2 py-0.5 rounded-sm bg-card border-border/60 text-foreground shrink-0"
        >
          {baseCurrency === CurrencyCode.UAH
            ? `${baseCurrency} (${symbol}) • 1:1`
            : `${baseCurrency} • ${activeRate.toFixed(2)} ₴/${symbol} ${bufferPercent > 0 ? `(+${bufferPercent}% ➔ ${effectiveRate.toFixed(2)} ₴)` : ''}`}
        </Badge>
      </div>

      {/* Balanced 12-Column Layout (Zero Viewport Clipping — UI-15) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Primary Currency & Rounding Policy */}
        <div className="lg:col-span-7">
          <SupplierCurrencyFormCard
            baseCurrency={baseCurrency}
            setBaseCurrency={handleBaseCurrencyChange}
            exchangeMode={exchangeMode}
            setExchangeMode={handleExchangeModeChange}
            activeRate={activeRate}
            effectiveRate={effectiveRate}
            setManualRate={setManualRate}
            bufferPercent={bufferPercent}
            setBufferPercent={setBufferPercent}
            roundingMode={roundingMode}
            setRoundingMode={setRoundingMode}
            customRoundingRules={customRoundingRules}
            onAddCustomRoundingRule={handleAddCustomRoundingRule}
            onDeleteCustomRoundingRule={handleDeleteCustomRoundingRule}
            selectedBankId={selectedBankId}
            isDirty={isDirty}
            onReset={handleResetChanges}
            isSaving={isSaving}
            onSave={handleSaveCurrencyConfig}
          />
        </div>

        {/* Right Column: Compact Bank Rates Matrix + Live Conversion Simulator */}
        <div className="lg:col-span-5 space-y-2.5">
          <CompactBankRatesTable
            selectedCurrency={baseCurrency === CurrencyCode.UAH ? CurrencyCode.USD : baseCurrency}
            onCurrencyChange={handleBaseCurrencyChange}
            selectedBankId={selectedBankId}
            onSelectBankRate={handleSelectBankRate}
            onRatesLoaded={handleBankRatesSynced}
          />

          <SupplierCurrencyPreviewCard
            baseCurrency={baseCurrency}
            activeRate={activeRate}
            bufferPercent={bufferPercent}
            roundingMode={roundingMode}
            isFetchingRates={isFetchingRates}
            onRefreshRates={() => void loadRates(true)}
          />
        </div>
      </div>
    </div>
  );
};
