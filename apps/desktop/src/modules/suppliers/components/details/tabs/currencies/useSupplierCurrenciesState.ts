import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  SupplierDto,
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
  type CustomRoundingRuleDto,
  type CustomRoundingRuleType,
  buildCustomRoundingRule,
} from '@smartfeed/shared';
import { fetchLiveExchangeRates, updateSupplier } from '@/lib/api';
import { DEFAULT_RATES, type BankExchangeRate } from '@/lib/api/currencies';
import { useAuth } from '@/contexts/AuthContext';

interface UseSupplierCurrenciesStateParams {
  supplier: SupplierDto;
  onRefreshSupplier: () => void;
}

export const CURRENCY_OPTIONS: Array<[CurrencyCode, string, string]> = [
  [CurrencyCode.UAH, 'suppliers:currUah', 'UAH (Гривня ₴)'],
  [CurrencyCode.USD, 'suppliers:currUsd', 'USD (Долар США $)'],
  [CurrencyCode.EUR, 'suppliers:currEur', 'EUR (Євро €)'],
  [CurrencyCode.PLN, 'suppliers:currPln', 'PLN (Польський злотий zł)'],
  [CurrencyCode.GBP, 'suppliers:currGbp', 'GBP (Фунт стерлінгів £)'],
  [CurrencyCode.CNY, 'suppliers:currCny', 'CNY (Китайський юань ¥)'],
];

export const MODE_OPTIONS: Array<[ExchangeRateMode, string, string]> = [
  [ExchangeRateMode.AUTO_NBU, 'suppliers:modeNbu', 'Офіційний курс НБУ (Автоматично)'],
  [ExchangeRateMode.AUTO_PRIVAT, 'suppliers:modePrivat', 'ПриватБанк (Картковий курс)'],
  [ExchangeRateMode.MANUAL, 'suppliers:modeManualBank', 'Фіксований вручну / Банківський'],
];

export const ROUNDING_OPTIONS: Array<[PriceRoundingMode, string, string]> = [
  [PriceRoundingMode.NONE, 'suppliers:roundingNone', 'Без округлення (копійки як є)'],
  [PriceRoundingMode.NEAREST_INTEGER, 'suppliers:roundingNearestInteger', 'До цілої гривні'],
  [PriceRoundingMode.DECIMAL_99, 'suppliers:roundingDecimal99', 'Закінчення .99 (напр. 449.99 ₴)'],
  [PriceRoundingMode.DECIMAL_95, 'suppliers:roundingDecimal95', 'Закінчення .95 (напр. 449.95 ₴)'],
  [PriceRoundingMode.INTEGER_9, 'suppliers:roundingInteger9', 'Закінчення на 9 (напр. 449 ₴)'],
  [PriceRoundingMode.INTEGER_7, 'suppliers:roundingInteger7', 'Закінчення на 7 (напр. 447 ₴)'],
  [PriceRoundingMode.INTEGER_5, 'suppliers:roundingInteger5', 'Закінчення на 5 (напр. 445 ₴)'],
];

export const BUFFER_PRESETS = [0, 1, 2, 3, 5];

export function useSupplierCurrenciesState({
  supplier,
  onRefreshSupplier,
}: UseSupplierCurrenciesStateParams) {
  const { token } = useAuth();
  const initialCurrency = supplier.baseCurrency || CurrencyCode.UAH;
  const initialMode = supplier.exchangeRateMode || ExchangeRateMode.MANUAL;
  const initialRate =
    initialCurrency !== CurrencyCode.UAH &&
    (!supplier.exchangeRate || Number(supplier.exchangeRate) <= 1)
      ? DEFAULT_RATES[initialCurrency] || 41.5
      : Number(supplier.exchangeRate || 1.0);

  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(initialCurrency);
  const [exchangeMode, setExchangeMode] = useState<ExchangeRateMode>(initialMode);
  const [manualRate, setManualRate] = useState<number>(initialRate);
  const [bufferPercent, setBufferPercent] = useState<number>(
    Number(supplier.currencyBufferPercent || 0),
  );
  const [roundingMode, setRoundingMode] = useState<PriceRoundingMode | string>(
    supplier.priceRounding || PriceRoundingMode.NONE,
  );
  const [customRoundingRules, setCustomRoundingRules] = useState<CustomRoundingRuleDto[]>(
    Array.isArray(supplier.customRoundingRules) ? supplier.customRoundingRules : [],
  );
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>(() => {
    if (initialMode === ExchangeRateMode.AUTO_NBU) return 'nbu';
    if (initialMode === ExchangeRateMode.AUTO_PRIVAT) return 'privat';
    return undefined;
  });

  const [liveRates, setLiveRates] = useState<Record<CurrencyCode, number>>({ ...DEFAULT_RATES });
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFetchingRef = useRef(false);
  const hasLoadedInitialRef = useRef(false);

  const loadRates = useCallback(async (force = false) => {
    if (isFetchingRef.current && !force) return;
    isFetchingRef.current = true;
    setIsFetchingRates(true);
    try {
      const rates = await fetchLiveExchangeRates(force);
      setLiveRates(rates);
    } catch (err) {
      console.warn('[useSupplierCurrenciesState:loadRates] Error:', err);
    } finally {
      isFetchingRef.current = false;
      setIsFetchingRates(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedInitialRef.current) {
      hasLoadedInitialRef.current = true;
      void loadRates(false);
    }
  }, [loadRates]);

  const handleBaseCurrencyChange = useCallback(
    (nextCurrency: CurrencyCode) => {
      setBaseCurrency(nextCurrency);
      if (nextCurrency === CurrencyCode.UAH) {
        setManualRate(1.0);
        setSelectedBankId(undefined);
        return;
      }
      if (
        nextCurrency === supplier.baseCurrency &&
        supplier.exchangeRate &&
        Number(supplier.exchangeRate) > 1
      ) {
        setManualRate(Number(supplier.exchangeRate));
        return;
      }
      setManualRate(liveRates[nextCurrency] || DEFAULT_RATES[nextCurrency] || 41.5);
      if (!selectedBankId) setSelectedBankId('nbu');
    },
    [liveRates, selectedBankId, supplier.baseCurrency, supplier.exchangeRate],
  );

  const handleExchangeModeChange = useCallback(
    (nextMode: ExchangeRateMode) => {
      setExchangeMode(nextMode);
      if (baseCurrency === CurrencyCode.UAH) return;
      if (nextMode === ExchangeRateMode.AUTO_NBU) {
        setSelectedBankId('nbu');
        setManualRate(liveRates[baseCurrency] || DEFAULT_RATES[baseCurrency] || 41.5);
      } else if (nextMode === ExchangeRateMode.AUTO_PRIVAT) {
        setSelectedBankId('privat');
      }
    },
    [baseCurrency, liveRates],
  );

  const activeRate = useMemo(() => {
    if (baseCurrency === CurrencyCode.UAH) return 1.0;
    const fallback = liveRates[baseCurrency] || DEFAULT_RATES[baseCurrency] || 41.5;
    if (exchangeMode === ExchangeRateMode.AUTO_NBU)
      return liveRates[baseCurrency] || manualRate || fallback;
    return manualRate > 0 ? manualRate : fallback;
  }, [baseCurrency, exchangeMode, manualRate, liveRates]);

  const effectiveRate = useMemo(() => {
    if (baseCurrency === CurrencyCode.UAH) return 1.0;
    const safeBuffer = Math.max(0, Math.min(100, bufferPercent || 0));
    return Math.round(activeRate * (1 + safeBuffer / 100) * 100) / 100;
  }, [activeRate, baseCurrency, bufferPercent]);

  const handleSelectBankRate = useCallback((bankRate: BankExchangeRate) => {
    setSelectedBankId(bankRate.bankId);
    setBaseCurrency(bankRate.currency);
    setManualRate(bankRate.sellRate);
    if (bankRate.bankId === 'nbu') setExchangeMode(ExchangeRateMode.AUTO_NBU);
    else if (bankRate.bankId === 'privat') setExchangeMode(ExchangeRateMode.AUTO_PRIVAT);
    else setExchangeMode(ExchangeRateMode.MANUAL);
  }, []);

  const handleBankRatesSynced = useCallback(
    (currency: CurrencyCode, rates: BankExchangeRate[]) => {
      const nbu = rates.find((r) => r.bankId === 'nbu');
      if (nbu && nbu.sellRate > 0) {
        setLiveRates((prev) =>
          prev[currency] === nbu.sellRate ? prev : { ...prev, [currency]: nbu.sellRate },
        );
      }
      if (currency === baseCurrency && selectedBankId) {
        const matchedBank = rates.find((r) => r.bankId === selectedBankId);
        if (matchedBank && matchedBank.sellRate > 0 && manualRate === DEFAULT_RATES[currency]) {
          setManualRate(matchedBank.sellRate);
        }
      }
    },
    [baseCurrency, manualRate, selectedBankId],
  );

  const isDirty = useMemo(() => {
    const savedCurr = supplier.baseCurrency || CurrencyCode.UAH;
    const savedMode = supplier.exchangeRateMode || ExchangeRateMode.MANUAL;
    const savedRate = Number(supplier.exchangeRate || 1.0);
    const savedBuffer = Number(supplier.currencyBufferPercent || 0);
    const savedRounding = supplier.priceRounding || PriceRoundingMode.NONE;
    return (
      baseCurrency !== savedCurr ||
      exchangeMode !== savedMode ||
      Math.abs(activeRate - savedRate) > 0.001 ||
      Math.abs(bufferPercent - savedBuffer) > 0.001 ||
      roundingMode !== savedRounding
    );
  }, [activeRate, baseCurrency, bufferPercent, exchangeMode, roundingMode, supplier]);

  const handleResetChanges = useCallback(() => {
    setBaseCurrency(initialCurrency);
    setExchangeMode(initialMode);
    setManualRate(initialRate);
    setBufferPercent(Number(supplier.currencyBufferPercent || 0));
    setRoundingMode(supplier.priceRounding || PriceRoundingMode.NONE);
    setCustomRoundingRules(
      Array.isArray(supplier.customRoundingRules) ? supplier.customRoundingRules : [],
    );
  }, [initialCurrency, initialMode, initialRate, supplier]);

  const handleAddCustomRoundingRule = useCallback(
    async (type: CustomRoundingRuleType, rawValue: number) => {
      const rule = buildCustomRoundingRule(type, rawValue);
      const nextRules = [...customRoundingRules.filter((item) => item.code !== rule.code), rule];
      setCustomRoundingRules(nextRules);
      setRoundingMode(rule.code);
      try {
        await updateSupplier(
          supplier.id,
          { priceRounding: rule.code, customRoundingRules: nextRules },
          token || undefined,
        );
        onRefreshSupplier();
      } catch (err) {
        console.warn('[useSupplierCurrenciesState:handleAddCustomRoundingRule] Error:', err);
      }
    },
    [customRoundingRules, onRefreshSupplier, supplier.id, token],
  );

  const handleDeleteCustomRoundingRule = useCallback(
    async (code: string) => {
      const nextRules = customRoundingRules.filter((item) => item.code !== code);
      const nextRounding = roundingMode === code ? PriceRoundingMode.NONE : roundingMode;
      setCustomRoundingRules(nextRules);
      setRoundingMode(nextRounding);
      try {
        await updateSupplier(
          supplier.id,
          { priceRounding: nextRounding, customRoundingRules: nextRules },
          token || undefined,
        );
        onRefreshSupplier();
      } catch (err) {
        console.warn('[useSupplierCurrenciesState:handleDeleteCustomRoundingRule] Error:', err);
      }
    },
    [customRoundingRules, onRefreshSupplier, roundingMode, supplier.id, token],
  );

  const handleSaveCurrencyConfig = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSupplier(
        supplier.id,
        {
          baseCurrency,
          exchangeRateMode: exchangeMode,
          exchangeRate: activeRate,
          currencyBufferPercent: baseCurrency === CurrencyCode.UAH ? 0 : bufferPercent,
          priceRounding: roundingMode,
          customRoundingRules,
        },
        token || undefined,
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[useSupplierCurrenciesState:handleSaveCurrencyConfig] Error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [
    activeRate,
    baseCurrency,
    bufferPercent,
    customRoundingRules,
    exchangeMode,
    onRefreshSupplier,
    roundingMode,
    supplier.id,
    token,
  ]);

  return {
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
  };
}
