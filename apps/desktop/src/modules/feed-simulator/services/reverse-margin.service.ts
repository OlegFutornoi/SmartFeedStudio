import type { FeedAnalysisResult } from '@/lib/api';
import type {
  SimulatorProduct,
  ReverseEarningsResult,
  SafetyStatus,
} from '@/modules/feed-simulator/types';

export const BENCHMARK_SIMULATOR_PRODUCTS: SimulatorProduct[] = [
  {
    id: 'bench-1',
    categoryName: 'Дім та Світло',
    categoryIcon: 'Lightbulb',
    title: 'Сенсорний вимикач Livolo White Glass 1-gang',
    sku: 'VL-C701-11',
    imageUrl:
      'https://images.unsplash.com/photo-1550985543-f47f38aee6c4?w=400&auto=format&fit=crop&q=80',
    costPrice: 420,
    marketplaceName: 'Rozetka',
    marketplaceCommissionPercent: 15,
    defaultRetailPrice: 750,
    minPrice: 450,
    maxPrice: 1200,
  },
  {
    id: 'bench-2',
    categoryName: 'Гаджети та Електроніка',
    categoryIcon: 'Smartphone',
    title: 'TWS Бездротові Навушники Pro Bass ANC',
    sku: 'TWS-PRO-BLK',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
    costPrice: 850,
    marketplaceName: 'Rozetka',
    marketplaceCommissionPercent: 10,
    defaultRetailPrice: 1350,
    minPrice: 900,
    maxPrice: 2000,
  },
  {
    id: 'bench-3',
    categoryName: 'Одяг та Взуття',
    categoryIcon: 'Shirt',
    title: 'Кросівки дихаючі Urban Sport Runner',
    sku: 'UB-RUN-42',
    imageUrl:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80',
    costPrice: 1100,
    marketplaceName: 'Prom',
    marketplaceCommissionPercent: 18,
    defaultRetailPrice: 1900,
    minPrice: 1200,
    maxPrice: 2800,
  },
  {
    id: 'bench-4',
    categoryName: 'Краса та Догляд',
    categoryIcon: 'Sparkles',
    title: 'Мультистайлер 5-в-1 з іонізацією AirStyle',
    sku: 'STYL-5IN1-ROSE',
    imageUrl:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
    costPrice: 1450,
    marketplaceName: 'Rozetka',
    marketplaceCommissionPercent: 16,
    defaultRetailPrice: 2400,
    minPrice: 1600,
    maxPrice: 3500,
  },
  {
    id: 'bench-5',
    categoryName: 'Інструменти та Авто',
    categoryIcon: 'Wrench',
    title: 'Акумуляторний шуруповерт Brushless 20V',
    sku: 'DW-DRL-20V',
    imageUrl:
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&auto=format&fit=crop&q=80',
    costPrice: 2100,
    marketplaceName: 'Epicentr',
    marketplaceCommissionPercent: 12,
    defaultRetailPrice: 3200,
    minPrice: 2300,
    maxPrice: 4800,
  },
];

export function getCategoryCommission(categoryName = ''): { name: string; percent: number } {
  const lower = categoryName.toLowerCase();
  if (lower.includes('одяг') || lower.includes('взутт') || lower.includes('кросівк')) {
    return { name: 'Prom', percent: 18 };
  }
  if (
    lower.includes('крас') ||
    lower.includes('догляд') ||
    lower.includes('космет') ||
    lower.includes('фен')
  ) {
    return { name: 'Rozetka', percent: 16 };
  }
  if (
    lower.includes('світл') ||
    lower.includes('вимикач') ||
    lower.includes('розетк') ||
    lower.includes('дім')
  ) {
    return { name: 'Rozetka', percent: 15 };
  }
  if (
    lower.includes('інструмент') ||
    lower.includes('авто') ||
    lower.includes('ремонт') ||
    lower.includes('шуруп')
  ) {
    return { name: 'Epicentr', percent: 12 };
  }
  if (
    lower.includes('смартфон') ||
    lower.includes('телефон') ||
    lower.includes('навушн') ||
    lower.includes('гаджет')
  ) {
    return { name: 'Rozetka', percent: 10 };
  }
  return { name: 'Rozetka', percent: 15 };
}

export function getSafetyStatus(marginPercent: number, netProfitCash: number): SafetyStatus {
  if (netProfitCash <= 0 || marginPercent <= 0) return 'BURNOUT_LOSS';
  if (marginPercent < 12) return 'RISK';
  return 'SAFE';
}

export function calculateReverseEarnings(
  costPrice: number,
  retailPrice: number,
  marketplacePercent: number,
): ReverseEarningsResult {
  const safeRetail = Math.max(0, retailPrice);
  const marketplaceFee = Math.round((safeRetail * marketplacePercent) / 100);
  const netProfitCash = Math.round(safeRetail - marketplaceFee - costPrice);
  const marginPercent = safeRetail > 0 ? Math.round((netProfitCash / safeRetail) * 1000) / 10 : 0;
  const markupPercent = costPrice > 0 ? Math.round((netProfitCash / costPrice) * 1000) / 10 : 0;

  return {
    marketplaceFee,
    netProfitCash,
    marginPercent,
    markupPercent,
    safetyStatus: getSafetyStatus(marginPercent, netProfitCash),
  };
}

export function extractCategoryProductsFromAnalysis(
  analysis: FeedAnalysisResult | null | undefined,
): SimulatorProduct[] {
  if (!analysis?.sampleProducts || analysis.sampleProducts.length === 0) {
    return BENCHMARK_SIMULATOR_PRODUCTS;
  }

  const seenCategories = new Set<string>();
  const extracted: SimulatorProduct[] = [];

  for (const p of analysis.sampleProducts) {
    const catName = p.categoryName || 'Каталог товарів';
    if (!seenCategories.has(catName)) {
      seenCategories.add(catName);
      const { name: mName, percent: mPercent } = getCategoryCommission(catName);
      const cost = p.costPrice > 0 ? p.costPrice : 500;
      const initialRetail = Math.round((cost / (1 - mPercent / 100)) * 1.25);

      extracted.push({
        id: `feed-cat-${extracted.length + 1}`,
        categoryName: catName,
        categoryIcon: 'Tag',
        title: p.titleUk || 'Товар із прайсу',
        sku: p.sku || `SKU-${extracted.length + 1}`,
        imageUrl:
          p.images?.[0]?.originalUrl ||
          BENCHMARK_SIMULATOR_PRODUCTS[extracted.length % BENCHMARK_SIMULATOR_PRODUCTS.length]
            .imageUrl,
        costPrice: cost,
        marketplaceName: mName,
        marketplaceCommissionPercent: mPercent,
        defaultRetailPrice: initialRetail,
        minPrice: Math.round(cost * 0.9),
        maxPrice: Math.round(cost * 3),
        isFromFeed: true,
      });

      if (extracted.length >= 5) break;
    }
  }

  if (extracted.length < 5) {
    for (const b of BENCHMARK_SIMULATOR_PRODUCTS) {
      if (!seenCategories.has(b.categoryName)) {
        seenCategories.add(b.categoryName);
        extracted.push(b);
        if (extracted.length >= 5) break;
      }
    }
  }

  return extracted;
}
