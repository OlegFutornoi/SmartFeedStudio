export type SafetyStatus = 'SAFE' | 'RISK' | 'BURNOUT_LOSS';

export interface SimulatorProduct {
  id: string;
  categoryName: string;
  categoryIcon: 'Lightbulb' | 'Smartphone' | 'Shirt' | 'Sparkles' | 'Wrench' | 'Tag';
  title: string;
  sku: string;
  imageUrl: string;
  costPrice: number;
  marketplaceName: string;
  marketplaceCommissionPercent: number;
  defaultRetailPrice: number;
  minPrice: number;
  maxPrice: number;
  isFromFeed?: boolean;
}

export interface ReverseEarningsResult {
  marketplaceFee: number;
  netProfitCash: number;
  marginPercent: number;
  markupPercent: number;
  safetyStatus: SafetyStatus;
}
