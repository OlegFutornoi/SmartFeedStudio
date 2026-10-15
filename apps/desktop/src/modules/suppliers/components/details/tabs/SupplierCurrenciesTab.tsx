import React, { useState, useEffect, useMemo } from 'react';
import { SupplierDto, CurrencyCode, ExchangeRateMode, PriceRoundingMode } from '@smartfeed/shared';
import { fetchLiveExchangeRates, updateSupplier } from '@/lib/api';
import type { BankExchangeRate } from '@/lib/api/currencies';
import { useAuth } from '@/contexts/AuthContext';
import { CompactBankRatesTable } from '@/modules/suppliers/components/details/tabs/currencies/CompactBankRatesTable';
import { SupplierCurrencyFormCard } from '@/modules/suppliers/components/details/tabs/currencies/SupplierCurrencyFormCard';
import { SupplierCurrencyPreviewCard } from '@/modules/suppliers/components/details/tabs/currencies/SupplierCurrencyPreviewCard';

interface SupplierCurrenciesTabProps {
  supplier: SupplierDto;
  onRefreshSupplier: () => void;
}

export const SupplierCurrenciesTab: React.FC<SupplierCurrenciesTabProps> = ({
  supplier,
  onRefreshSupplier,
}) => {
  const { token } = useAuth();

  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(
    supplier.baseCurrency || CurrencyCode.UAH,
  );
  const [exchangeMode, setExchangeMode] = useState<ExchangeRateMode>(
    supplier.exchangeRateMode || ExchangeRateMode.MANUAL,
  );
  const [manualRate, setManualRate] = useState<number>(supplier.exchangeRate || 1.0);
  const [bufferPercent, setBufferPercent] = useState<number>(supplier.currencyBufferPercent || 0);
  const [roundingMode, setRoundingMode] = useState<PriceRoundingMode>(
    supplier.priceRounding || PriceRoundingMode.NONE,
  );
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>(undefined);

  const [liveRates, setLiveRates] = useState<Record<CurrencyCode, number>>({
    [CurrencyCode.UAH]: 1.0,
    [CurrencyCode.USD]: 41.5,
    [CurrencyCode.EUR]: 45.2,
    [CurrencyCode.PLN]: 10.45,
    [CurrencyCode.GBP]: 53.8,
    [CurrencyCode.CNY]: 5.85,
  });
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadRates = async (force = false) => {
    setIsFetchingRates(true);
    try {
      const rates = await fetchLiveExchangeRates(force);
      setLiveRates(rates);
    } catch (err) {
      console.warn('[SupplierCurrenciesTab:loadRates] Error:', err);
    } finally {
      setIsFetchingRates(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const activeRate = useMemo(() => {
    if (baseCurrency === CurrencyCode.UAH) return 1.0;
    if (exchangeMode === ExchangeRateMode.MANUAL) return manualRate;
    return liveRates[baseCurrency] || 1.0;
  }, [baseCurrency, exchangeMode, manualRate, liveRates]);

  const handleSelectBankRate = (bankRate: BankExchangeRate) => {
    setSelectedBankId(bankRate.bankId);
    setBaseCurrency(bankRate.currency);
    setManualRate(bankRate.sellRate);

    if (bankRate.bankId === 'nbu') {
      setExchangeMode(ExchangeRateMode.AUTO_NBU);
    } else if (bankRate.bankId === 'privat') {
      setExchangeMode(ExchangeRateMode.AUTO_PRIVAT);
    } else {
      setExchangeMode(ExchangeRateMode.MANUAL);
    }
  };

  const handleSaveCurrencyConfig = async () => {
    setIsSaving(true);
    try {
      await updateSupplier(
        supplier.id,
        {
          baseCurrency,
          exchangeRateMode: exchangeMode,
          exchangeRate: activeRate,
          currencyBufferPercent: bufferPercent,
          priceRounding: roundingMode,
        },
        token || undefined,
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierCurrenciesTab:handleSaveCurrencyConfig] Error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      data-testid="supplier-currencies-tab"
    >
      {/* Left Column: Primary Currency Configuration & Conversion Simulation */}
      <div className="lg:col-span-7 space-y-4">
        <SupplierCurrencyFormCard
          baseCurrency={baseCurrency}
          setBaseCurrency={setBaseCurrency}
          exchangeMode={exchangeMode}
          setExchangeMode={setExchangeMode}
          activeRate={activeRate}
          setManualRate={setManualRate}
          bufferPercent={bufferPercent}
          setBufferPercent={setBufferPercent}
          roundingMode={roundingMode}
          setRoundingMode={setRoundingMode}
          isSaving={isSaving}
          onSave={handleSaveCurrencyConfig}
        />

        <SupplierCurrencyPreviewCard
          baseCurrency={baseCurrency}
          activeRate={activeRate}
          bufferPercent={bufferPercent}
          roundingMode={roundingMode}
          isFetchingRates={isFetchingRates}
          onRefreshRates={() => loadRates(true)}
        />
      </div>

      {/* Right Column: Clean, Compact Bank Rates Matrix */}
      <div className="lg:col-span-5 sticky top-2">
        <CompactBankRatesTable
          selectedCurrency={baseCurrency === CurrencyCode.UAH ? CurrencyCode.USD : baseCurrency}
          onCurrencyChange={(curr) => setBaseCurrency(curr)}
          selectedBankId={selectedBankId}
          onSelectBankRate={handleSelectBankRate}
        />
      </div>
    </div>
  );
};
