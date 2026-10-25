import {
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
  type CustomRoundingRuleDto,
} from '@smartfeed/shared';

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

export function resolveInitialSupplierRates(feed: {
  baseCurrency?: string;
  exchangeRateMode?: string;
  exchangeRate?: number;
  currencyBufferPercent?: number;
  priceRounding?: string;
  customRoundingRules?: CustomRoundingRuleDto[];
  selectedBankId?: string | null;
}) {
  const currency = (feed?.baseCurrency || CurrencyCode.UAH) as CurrencyCode;
  const mode = (feed?.exchangeRateMode || ExchangeRateMode.MANUAL) as ExchangeRateMode;
  const rate =
    currency === CurrencyCode.UAH
      ? 1.0
      : feed?.exchangeRate && Number(feed.exchangeRate) > 0
        ? Number(feed.exchangeRate)
        : 0;
  const buffer = Number(feed?.currencyBufferPercent || 0);
  const rounding = (feed?.priceRounding || PriceRoundingMode.NONE) as PriceRoundingMode;
  const rules = Array.isArray(feed?.customRoundingRules) ? feed.customRoundingRules : [];
  const bankId =
    feed?.selectedBankId ||
    (mode === ExchangeRateMode.AUTO_NBU
      ? 'nbu'
      : mode === ExchangeRateMode.AUTO_PRIVAT
        ? 'privat'
        : undefined);

  return { currency, mode, rate, buffer, rounding, rules, bankId };
}
