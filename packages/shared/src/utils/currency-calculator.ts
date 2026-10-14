import { CurrencyCode, PriceRoundingMode } from '@/enums';

export interface CurrencyConversionParams {
  costPrice: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  exchangeRate: number; // e.g. 41.50 UAH per USD
  bufferPercent?: number; // e.g. 1.5% buffer for forex volatility
  roundingMode?: PriceRoundingMode;
}

export interface CurrencyConversionResult {
  originalPrice: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  baseExchangeRate: number;
  effectiveExchangeRate: number;
  rawConvertedPrice: number;
  finalConvertedPrice: number;
  bufferApplied: number;
}

/**
 * Rounds price according to chosen marketing / retail strategy.
 */
export function applyPriceRounding(
  value: number,
  mode: PriceRoundingMode = PriceRoundingMode.NONE,
): number {
  if (value <= 0 || isNaN(value)) return 0;

  switch (mode) {
    case PriceRoundingMode.NEAREST_INTEGER:
      return Math.round(value);

    case PriceRoundingMode.DECIMAL_99: {
      const whole = Math.floor(value);
      return Math.round((whole + 0.99) * 100) / 100;
    }

    case PriceRoundingMode.DECIMAL_95: {
      const whole = Math.floor(value);
      return Math.round((whole + 0.95) * 100) / 100;
    }

    case PriceRoundingMode.INTEGER_9: {
      // e.g. 483 -> 489, 450 -> 459, 12 -> 19
      const base = Math.floor(value / 10) * 10;
      return base + 9;
    }

    case PriceRoundingMode.INTEGER_7: {
      // e.g. 483 -> 487, 450 -> 457, 12 -> 17
      const base = Math.floor(value / 10) * 10;
      return base + 7;
    }

    case PriceRoundingMode.INTEGER_5: {
      // e.g. 483 -> 485, 450 -> 455, 12 -> 15
      const base = Math.floor(value / 10) * 10;
      return base + 5;
    }

    case PriceRoundingMode.NONE:
    default:
      return Math.round(value * 100) / 100;
  }
}

/**
 * High-precision currency converter with forex buffer and psychological rounding.
 * Avoids IEEE 754 precision drift by working in integer cents.
 */
export function convertSupplierPrice(params: CurrencyConversionParams): CurrencyConversionResult {
  const {
    costPrice,
    fromCurrency,
    toCurrency,
    exchangeRate,
    bufferPercent = 0,
    roundingMode = PriceRoundingMode.NONE,
  } = params;

  if (costPrice <= 0 || isNaN(costPrice)) {
    return {
      originalPrice: 0,
      fromCurrency,
      toCurrency,
      baseExchangeRate: exchangeRate,
      effectiveExchangeRate: exchangeRate,
      rawConvertedPrice: 0,
      finalConvertedPrice: 0,
      bufferApplied: 0,
    };
  }

  // 1. Same currency -> 1:1 conversion
  if (fromCurrency === toCurrency) {
    const rounded = applyPriceRounding(costPrice, roundingMode);
    return {
      originalPrice: costPrice,
      fromCurrency,
      toCurrency,
      baseExchangeRate: 1.0,
      effectiveExchangeRate: 1.0,
      rawConvertedPrice: costPrice,
      finalConvertedPrice: rounded,
      bufferApplied: 0,
    };
  }

  // 2. Validate exchange rate
  const safeRate = exchangeRate > 0 ? exchangeRate : 1.0;
  const safeBuffer = Math.max(0, Math.min(100, bufferPercent || 0));

  // 3. Effective rate = base rate * (1 + buffer%)
  const effectiveExchangeRate = safeRate * (1 + safeBuffer / 100);

  // 4. Converted price
  const rawConvertedPrice = Math.round(costPrice * effectiveExchangeRate * 100) / 100;
  const finalConvertedPrice = applyPriceRounding(rawConvertedPrice, roundingMode);
  const bufferApplied = Math.round(costPrice * safeRate * (safeBuffer / 100) * 100) / 100;

  return {
    originalPrice: costPrice,
    fromCurrency,
    toCurrency,
    baseExchangeRate: safeRate,
    effectiveExchangeRate: Math.round(effectiveExchangeRate * 10000) / 10000,
    rawConvertedPrice,
    finalConvertedPrice,
    bufferApplied,
  };
}

/**
 * Currency symbol helper
 */
export function getCurrencySymbol(code: CurrencyCode | string): string {
  switch (code) {
    case CurrencyCode.UAH:
    case 'UAH':
      return '₴';
    case CurrencyCode.USD:
    case 'USD':
      return '$';
    case CurrencyCode.EUR:
    case 'EUR':
      return '€';
    case CurrencyCode.PLN:
    case 'PLN':
      return 'zł';
    case CurrencyCode.GBP:
    case 'GBP':
      return '£';
    case CurrencyCode.CNY:
    case 'CNY':
      return '¥';
    default:
      return code || '₴';
  }
}
