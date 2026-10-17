import type { SimulatorProduct } from '@/modules/feed-simulator/types';

export interface CinemaScenario {
  product: SimulatorProduct;
  costPrice: number;
  markupPercent: number;
  desiredProfit: number;
  myPrice: number;
  marketplaceName: string;
  marketplacePercent: number;
  naivePrice: number;
  naiveMarketplaceFee: number;
  naiveActualProfit: number;
  profitLostToFee: number;
  profitLostPercent: number;
  smartRetailPrice: number;
  smartMarketplaceFee: number;
  guaranteedProfit: number;
  formulaDisplay: string;
}

export function buildCinemaScenario(product: SimulatorProduct): CinemaScenario {
  const cost = Math.max(10, Math.round(product.costPrice));
  const feePercent = product.marketplaceCommissionPercent || 15;
  const mName = product.marketplaceName || 'Rozetka';

  // Planned seller markup: 30% of cost or minimum 80 UAH
  const markupPercent = 30;
  const desiredProfit = Math.max(80, Math.round(cost * (markupPercent / 100)));
  const myPrice = cost + desiredProfit;

  // 1. Naive calculation (how sellers mistakenly calculate without reverse margin)
  const naivePrice = myPrice;
  const naiveMarketplaceFee = Math.round((naivePrice * feePercent) / 100);
  const naiveActualProfit = naivePrice - naiveMarketplaceFee - cost;
  const profitLostToFee = Math.max(0, desiredProfit - naiveActualProfit);
  const profitLostPercent = Math.min(100, Math.round((profitLostToFee / desiredProfit) * 100));

  // 2. Smart Reverse Margin calculation
  // Formula: retailPrice = (cost + desiredProfit) / (1 - feePercent / 100)
  // Which is equivalent to: retailPrice = myPrice / (1 - commission / 100)
  const smartRetailPrice = Math.round(myPrice / (1 - feePercent / 100));
  const smartMarketplaceFee = Math.round((smartRetailPrice * feePercent) / 100);
  const guaranteedProfit = smartRetailPrice - smartMarketplaceFee - cost;
  const formulaDisplay = `(${cost} ₴ + ${desiredProfit} ₴) ÷ (1 - ${feePercent}%) = ${smartRetailPrice} ₴`;

  return {
    product,
    costPrice: cost,
    markupPercent,
    desiredProfit,
    myPrice,
    marketplaceName: mName,
    marketplacePercent: feePercent,
    naivePrice,
    naiveMarketplaceFee,
    naiveActualProfit,
    profitLostToFee,
    profitLostPercent,
    smartRetailPrice,
    smartMarketplaceFee,
    guaranteedProfit,
    formulaDisplay,
  };
}
