/**
 * SmartFeed Studio — High-Precision Pricing & Reverse Margin Calculation Engine
 *
 * Mathematical Model:
 * 1. Ingestion: CostPrice -> Supplier Markup -> Category Rule -> Price Bracket Rule -> BasePrice (RRP)
 * 2. Export / Marketplace: BasePrice + ExtraCost -> Marketplace Commission -> Reverse Markup ShelfPrice
 * 3. Economics: ShelfPrice - Commission - ExtraCost - CostPrice -> NetProfit (₴ / %)
 */

export interface PricingRuleItem {
  id?: string;
  categoryId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  marginPercent?: number | null;
  fixedMarkup?: number | null;
  priority?: number;
  isActive?: boolean;
}

export interface CalculateBasePriceParams {
  costPrice: number;
  defaultMarginPercent?: number;
  defaultFixedMarkup?: number;
  categoryId?: string | null;
  rules?: PricingRuleItem[];
}

export interface BasePriceCalculationResult {
  costPrice: number;
  sellingPrice: number;
  appliedMarginPercent: number;
  appliedFixedMarkup: number;
  matchedRuleType: 'CATEGORY' | 'PRICE_BRACKET' | 'DEFAULT';
  matchedRuleId?: string;
}

/**
 * Calculates base selling price from supplier cost price applying category or tiered price bracket rules.
 */
export function calculateBaseSellingPrice(
  params: CalculateBasePriceParams,
): BasePriceCalculationResult {
  const cost = Math.max(0, Number(params.costPrice) || 0);
  const defaultMargin = Number(params.defaultMarginPercent) || 0;
  const defaultFixed = Number(params.defaultFixedMarkup) || 0;
  const categoryId = params.categoryId || null;
  const activeRules = (params.rules || [])
    .filter((r) => r.isActive !== false)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // 1. Try to find a category-specific rule first (if categoryId is provided)
  if (categoryId) {
    const categoryRule = activeRules.find(
      (r) => r.categoryId === categoryId && r.minPrice == null && r.maxPrice == null,
    );
    if (categoryRule) {
      const margin = Number(categoryRule.marginPercent) || 0;
      const fixed = Number(categoryRule.fixedMarkup) || 0;
      const price = cost * (1 + margin / 100) + fixed;
      return {
        costPrice: cost,
        sellingPrice: Math.round(price * 100) / 100,
        appliedMarginPercent: margin,
        appliedFixedMarkup: fixed,
        matchedRuleType: 'CATEGORY',
        matchedRuleId: categoryRule.id,
      };
    }
  }

  // 2. Try to find a price bracket rule (e.g. 0-500 UAH, 500-2000 UAH)
  const bracketRule = activeRules.find((r) => {
    const min = r.minPrice != null ? Number(r.minPrice) : -Infinity;
    const max = r.maxPrice != null ? Number(r.maxPrice) : Infinity;
    const matchesCategory = r.categoryId ? r.categoryId === categoryId : true;
    return matchesCategory && cost >= min && cost <= max;
  });

  if (bracketRule) {
    const margin = Number(bracketRule.marginPercent) || 0;
    const fixed = Number(bracketRule.fixedMarkup) || 0;
    const price = cost * (1 + margin / 100) + fixed;
    return {
      costPrice: cost,
      sellingPrice: Math.round(price * 100) / 100,
      appliedMarginPercent: margin,
      appliedFixedMarkup: fixed,
      matchedRuleType: 'PRICE_BRACKET',
      matchedRuleId: bracketRule.id,
    };
  }

  // 3. Fallback to supplier default markup
  const price = cost * (1 + defaultMargin / 100) + defaultFixed;
  return {
    costPrice: cost,
    sellingPrice: Math.round(price * 100) / 100,
    appliedMarginPercent: defaultMargin,
    appliedFixedMarkup: defaultFixed,
    matchedRuleType: 'DEFAULT',
  };
}

export interface ReverseMarkupParams {
  basePrice: number;
  commissionPercent: number;
  extraFixedCost?: number;
  applyReverseMarkup?: boolean;
}

/**
 * Calculates marketplace shelf price with reverse markup formula:
 * ShelfPrice = (BasePrice + ExtraFixedCost) / (1 - CommissionPercent / 100)
 */
export function calculateMarketplaceShelfPrice(params: ReverseMarkupParams): number {
  const base = Math.max(0, Number(params.basePrice) || 0);
  const extra = Math.max(0, Number(params.extraFixedCost) || 0);
  const commPercent = Math.max(0, Math.min(99, Number(params.commissionPercent) || 0));
  const applyReverse = params.applyReverseMarkup !== false;

  if (!applyReverse || commPercent === 0) {
    const directPrice = (base + extra) * (1 + commPercent / 100);
    return Math.round(directPrice * 100) / 100;
  }

  const commissionFraction = commPercent / 100;
  const denominator = Math.max(0.01, 1 - commissionFraction);
  const shelfPrice = (base + extra) / denominator;

  return Math.round(shelfPrice * 100) / 100;
}

export interface MarketplaceEconomicsParams {
  costPrice: number;
  shelfPrice: number;
  commissionPercent: number;
  extraFixedCost?: number;
}

export interface MarketplaceEconomicsResult {
  costPrice: number;
  shelfPrice: number;
  commissionPercent: number;
  commissionAmount: number;
  extraFixedCost: number;
  payoutAmount: number;
  netProfit: number;
  netMarginPercent: number;
  returnOnSalesPercent: number;
}

/**
 * Computes exact economics breakdown: commission paid to marketplace, net payout, and true net profit.
 */
export function calculateMarketplaceEconomics(
  params: MarketplaceEconomicsParams,
): MarketplaceEconomicsResult {
  const cost = Math.max(0, Number(params.costPrice) || 0);
  const shelf = Math.max(0, Number(params.shelfPrice) || 0);
  const commPercent = Math.max(0, Number(params.commissionPercent) || 0);
  const extra = Math.max(0, Number(params.extraFixedCost) || 0);

  const commissionAmount = Math.round(shelf * (commPercent / 100) * 100) / 100;
  const payoutAmount = Math.round((shelf - commissionAmount) * 100) / 100;
  const netProfit = Math.round((payoutAmount - extra - cost) * 100) / 100;

  const netMarginPercent = cost > 0 ? Math.round((netProfit / cost) * 10000) / 100 : 0;
  const returnOnSalesPercent = shelf > 0 ? Math.round((netProfit / shelf) * 10000) / 100 : 0;

  return {
    costPrice: cost,
    shelfPrice: shelf,
    commissionPercent: commPercent,
    commissionAmount,
    extraFixedCost: extra,
    payoutAmount,
    netProfit,
    netMarginPercent,
    returnOnSalesPercent,
  };
}

export interface FullPriceSimulationParams {
  costPrice: number;
  supplierMarginPercent?: number;
  supplierFixedMarkup?: number;
  marketplaceCommissionPercent: number;
  marketplaceExtraFixedCost?: number;
  applyReverseMarkup?: boolean;
}

export interface FullPriceSimulationResult {
  costPrice: number;
  basePrice: number;
  supplierMarkupProfit: number;
  shelfPrice: number;
  commissionAmount: number;
  extraFixedCost: number;
  payoutAmount: number;
  netProfit: number;
  netMarginPercent: number;
  returnOnSalesPercent: number;
}

/**
 * End-to-end price simulation from supplier cost to marketplace shelf price and profit.
 */
export function simulateFullPricing(params: FullPriceSimulationParams): FullPriceSimulationResult {
  const cost = Math.max(0, Number(params.costPrice) || 0);
  const baseResult = calculateBaseSellingPrice({
    costPrice: cost,
    defaultMarginPercent: params.supplierMarginPercent,
    defaultFixedMarkup: params.supplierFixedMarkup,
  });

  const basePrice = baseResult.sellingPrice;
  const supplierMarkupProfit = Math.round((basePrice - cost) * 100) / 100;

  const shelfPrice = calculateMarketplaceShelfPrice({
    basePrice,
    commissionPercent: params.marketplaceCommissionPercent,
    extraFixedCost: params.marketplaceExtraFixedCost,
    applyReverseMarkup: params.applyReverseMarkup,
  });

  const economics = calculateMarketplaceEconomics({
    costPrice: cost,
    shelfPrice,
    commissionPercent: params.marketplaceCommissionPercent,
    extraFixedCost: params.marketplaceExtraFixedCost,
  });

  return {
    costPrice: cost,
    basePrice,
    supplierMarkupProfit,
    shelfPrice,
    commissionAmount: economics.commissionAmount,
    extraFixedCost: economics.extraFixedCost,
    payoutAmount: economics.payoutAmount,
    netProfit: economics.netProfit,
    netMarginPercent: economics.netMarginPercent,
    returnOnSalesPercent: economics.returnOnSalesPercent,
  };
}
