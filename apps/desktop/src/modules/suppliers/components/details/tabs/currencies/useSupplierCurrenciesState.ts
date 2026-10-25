import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
  type CustomRoundingRuleDto,
  type CustomRoundingRuleType,
  type PriceRoundingValue,
  buildCustomRoundingRule,
} from '@smartfeed/shared';
import { fetchLiveExchangeRates } from '@/lib/api';
import { updateSupplierFeedSource, type FeedSourceItemDto } from '@/lib/api/feed-sources';
import { DEFAULT_RATES, type BankExchangeRate } from '@/lib/api/currencies';
import { useAuth } from '@/contexts/AuthContext';

interface UseSupplierCurrenciesStateParams {
  feed: FeedSourceItemDto;
  onRefreshFeed?: () => void;
}

export {
  CURRENCY_OPTIONS,
  MODE_OPTIONS,
  ROUNDING_OPTIONS,
  BUFFER_PRESETS,
  resolveInitialSupplierRates,
} from '@/modules/suppliers/components/details/tabs/currencies/currencies.constants';
import { resolveInitialSupplierRates } from '@/modules/suppliers/components/details/tabs/currencies/currencies.constants';

export function useSupplierCurrenciesState({
  feed,
  onRefreshFeed,
}: UseSupplierCurrenciesStateParams) {
  const { token } = useAuth();
  const init = resolveInitialSupplierRates(feed);

  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(init.currency);
  const [exchangeMode, setExchangeMode] = useState<ExchangeRateMode>(init.mode);
  const [manualRate, setManualRate] = useState<number>(init.rate);
  const [bufferPercent, setBufferPercent] = useState<number>(init.buffer);
  const [roundingMode, setRoundingMode] = useState<PriceRoundingMode | string>(init.rounding);
  const [customRoundingRules, setCustomRoundingRules] = useState<CustomRoundingRuleDto[]>(
    init.rules,
  );
  const [selectedBankId, setSelectedBankId] = useState<string | undefined>(init.bankId);

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

  useEffect(() => {
    const s = resolveInitialSupplierRates(feed);
    setBaseCurrency(s.currency);
    setExchangeMode(s.mode);
    setManualRate(s.rate);
    setBufferPercent(s.buffer);
    setRoundingMode(s.rounding);
    setCustomRoundingRules(s.rules);
    setSelectedBankId(s.bankId);
  }, [feed]);

  const handleBaseCurrencyChange = useCallback(
    (nextCurrency: CurrencyCode) => {
      setBaseCurrency(nextCurrency);
      if (nextCurrency === CurrencyCode.UAH) {
        setManualRate(1.0);
        setSelectedBankId(undefined);
        return;
      }
      if (
        nextCurrency === feed.baseCurrency &&
        feed.exchangeRate &&
        Number(feed.exchangeRate) > 1
      ) {
        setManualRate(Number(feed.exchangeRate));
        return;
      }
      setManualRate(liveRates[nextCurrency] || 1.0);
      if (!selectedBankId) setSelectedBankId('nbu');
    },
    [liveRates, selectedBankId, feed.baseCurrency, feed.exchangeRate],
  );

  const handleExchangeModeChange = useCallback(
    (nextMode: ExchangeRateMode) => {
      setExchangeMode(nextMode);
      if (baseCurrency === CurrencyCode.UAH) return;
      if (nextMode === ExchangeRateMode.AUTO_NBU) {
        setSelectedBankId('nbu');
        setManualRate(liveRates[baseCurrency] || 1.0);
      } else if (nextMode === ExchangeRateMode.AUTO_PRIVAT) {
        setSelectedBankId('privat');
      } else {
        setSelectedBankId(undefined);
      }
    },
    [baseCurrency, liveRates],
  );

  const handleSelectBankRate = useCallback((bankRate: BankExchangeRate) => {
    setSelectedBankId(bankRate.bankId);
    setManualRate(bankRate.sellRate || bankRate.buyRate);
  }, []);

  const handleBankRatesSynced = useCallback(
    (_currency: CurrencyCode, rates: BankExchangeRate[]) => {
      if (!rates.length) return;
      const nbu = rates.find((r) => r.bankId === 'nbu');
      if (nbu) {
        setLiveRates((prev) => ({
          ...prev,
          [nbu.currency as CurrencyCode]: nbu.sellRate || nbu.buyRate,
        }));
      }
    },
    [],
  );

  const activeRate = useMemo(() => {
    if (baseCurrency === CurrencyCode.UAH) return 1.0;
    if (exchangeMode === ExchangeRateMode.AUTO_NBU) {
      return liveRates[baseCurrency] || manualRate || 1.0;
    }
    return manualRate || 1.0;
  }, [baseCurrency, exchangeMode, liveRates, manualRate]);

  const effectiveRate = useMemo(() => {
    if (baseCurrency === CurrencyCode.UAH) return 1.0;
    const buf = Math.max(0, bufferPercent || 0);
    return Math.round(activeRate * (1 + buf / 100) * 10000) / 10000;
  }, [activeRate, baseCurrency, bufferPercent]);

  const initialValues = useMemo(() => resolveInitialSupplierRates(feed), [feed]);

  const isDirty = useMemo(() => {
    if (baseCurrency !== initialValues.currency) return true;
    if (exchangeMode !== initialValues.mode) return true;
    if (bufferPercent !== initialValues.buffer) return true;
    if (roundingMode !== initialValues.rounding) return true;
    if (selectedBankId !== initialValues.bankId) return true;
    if (Math.abs(manualRate - initialValues.rate) > 0.0001) return true;
    if (customRoundingRules.length !== initialValues.rules.length) return true;
    return false;
  }, [
    baseCurrency,
    bufferPercent,
    customRoundingRules.length,
    exchangeMode,
    initialValues,
    manualRate,
    roundingMode,
    selectedBankId,
  ]);

  const handleResetChanges = useCallback(() => {
    const s = resolveInitialSupplierRates(feed);
    setBaseCurrency(s.currency);
    setExchangeMode(s.mode);
    setManualRate(s.rate);
    setBufferPercent(s.buffer);
    setRoundingMode(s.rounding);
    setCustomRoundingRules(s.rules);
    setSelectedBankId(s.bankId);
  }, [feed]);

  const handleAddCustomRoundingRule = useCallback(
    async (type: CustomRoundingRuleType, rawValue: number) => {
      const rule = buildCustomRoundingRule(type, rawValue);
      const nextRules = [...customRoundingRules.filter((item) => item.code !== rule.code), rule];
      setCustomRoundingRules(nextRules);
      setRoundingMode(rule.code);
      try {
        await updateSupplierFeedSource(
          feed.supplierId,
          feed.id,
          { priceRounding: rule.code as PriceRoundingValue, customRoundingRules: nextRules },
          token || undefined,
        );
        onRefreshFeed?.();
      } catch (err) {
        console.warn('[useSupplierCurrenciesState:handleAddCustomRoundingRule] Error:', err);
      }
    },
    [customRoundingRules, onRefreshFeed, feed.supplierId, feed.id, token],
  );

  const handleDeleteCustomRoundingRule = useCallback(
    async (code: string) => {
      const nextRules = customRoundingRules.filter((item) => item.code !== code);
      const nextRounding = roundingMode === code ? PriceRoundingMode.NONE : roundingMode;
      setCustomRoundingRules(nextRules);
      setRoundingMode(nextRounding);
      try {
        await updateSupplierFeedSource(
          feed.supplierId,
          feed.id,
          { priceRounding: nextRounding as PriceRoundingValue, customRoundingRules: nextRules },
          token || undefined,
        );
        onRefreshFeed?.();
      } catch (err) {
        console.warn('[useSupplierCurrenciesState:handleDeleteCustomRoundingRule] Error:', err);
      }
    },
    [customRoundingRules, onRefreshFeed, roundingMode, feed.supplierId, feed.id, token],
  );

  const handleSaveCurrencyConfig = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateSupplierFeedSource(
        feed.supplierId,
        feed.id,
        {
          baseCurrency,
          exchangeRateMode: exchangeMode,
          exchangeRate: activeRate,
          currencyBufferPercent: baseCurrency === CurrencyCode.UAH ? 0 : bufferPercent,
          priceRounding: roundingMode as PriceRoundingValue,
          customRoundingRules,
          selectedBankId: selectedBankId ?? null,
        },
        token || undefined,
      );
      onRefreshFeed?.();
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
    onRefreshFeed,
    roundingMode,
    selectedBankId,
    feed.supplierId,
    feed.id,
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
