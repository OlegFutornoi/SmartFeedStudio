import { CurrencyCode, PriceRoundingMode } from '../enums/index.js';
import type { CustomRoundingRuleDto, CustomRoundingRuleType } from '../dtos/supplier.dto.js';

export interface CurrencyConversionParams {
  costPrice: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  exchangeRate: number; // e.g. 41.50 UAH per USD
  bufferPercent?: number; // e.g. 1.5% buffer for forex volatility
  roundingMode?: PriceRoundingMode | string;
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

export function buildCustomRoundingRule(
  type: CustomRoundingRuleType,
  rawValue: number,
): CustomRoundingRuleDto {
  const safeVal = Math.max(0, Math.floor(Number.isFinite(rawValue) ? rawValue : 0));
  if (type === 'DECIMAL') {
    const cents = Math.min(99, safeVal);
    const padded = String(cents).padStart(2, '0');
    const code = `CUSTOM_DEC_${padded}`;
    const sample = (449 + cents / 100).toFixed(2);
    return {
      code,
      type,
      value: cents,
      labelUk: `Закінчення .${padded} (напр. ${sample} ₴)`,
      labelEn: `Ending .${padded} (e.g. ${sample} ₴)`,
    };
  }

  if (type === 'MULTIPLE') {
    const step = Math.max(1, Math.min(10000, safeVal || 10));
    const code = `CUSTOM_MULT_${step}`;
    const sample = Math.round(483.4 / step) * step;
    return {
      code,
      type,
      value: step,
      labelUk: `Кратне ${step} ₴ (напр. ${sample} ₴)`,
      labelEn: `Multiple of ${step} ₴ (e.g. ${sample} ₴)`,
    };
  }

  // INTEGER_ENDING
  const ending = Math.min(999, safeVal);
  const code = `CUSTOM_INT_${ending}`;
  const digits = String(ending).length;
  const baseStep = Math.pow(10, digits);
  const sample = Math.floor(483.4 / baseStep) * baseStep + ending;
  return {
    code,
    type: 'INTEGER_ENDING',
    value: ending,
    labelUk: `Закінчення на ${ending} (напр. ${sample} ₴)`,
    labelEn: `Ending in ${ending} (e.g. ${sample} ₴)`,
  };
}

/**
 * Rounds price according to chosen marketing / retail strategy (supports built-in and custom rules).
 */
export function applyPriceRounding(
  value: number,
  mode: PriceRoundingMode | string = PriceRoundingMode.NONE,
): number {
  if (value <= 0 || isNaN(value)) return 0;

  if (typeof mode === 'string') {
    if (mode.startsWith('CUSTOM_DEC_')) {
      const cents = Math.max(0, Math.min(99, parseInt(mode.replace('CUSTOM_DEC_', ''), 10) || 0));
      const whole = Math.floor(value);
      return Math.round((whole + cents / 100) * 100) / 100;
    }

    if (mode.startsWith('CUSTOM_INT_')) {
      const ending = Math.max(0, parseInt(mode.replace('CUSTOM_INT_', ''), 10) || 0);
      const digits = Math.max(1, String(ending).length);
      const step = Math.pow(10, digits);
      const base = Math.floor(value / step) * step;
      const candidate = base + ending;
      return candidate > 0 ? candidate : ending || Math.round(value);
    }

    if (mode.startsWith('CUSTOM_MULT_')) {
      const step = Math.max(1, parseInt(mode.replace('CUSTOM_MULT_', ''), 10) || 1);
      const rounded = Math.round(value / step) * step;
      return rounded > 0 ? Math.round(rounded * 100) / 100 : step;
    }
  }

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
