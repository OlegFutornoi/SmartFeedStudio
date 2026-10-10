export type ShowcaseStageId = 'prep' | 'sync' | 'revenue';

export interface RevenueGrowthPoint {
  monthKey: string;
  monthLabelUk: string;
  monthLabelEn: string;
  revenue: number; // e.g. 45000 -> 580000
  profit: number; // e.g. 14000 -> 195000
  ordersCount: number; // e.g. 45 -> 640
  activeMarketplaces: number; // 1 -> 4
}

export interface AiActionLogItem {
  id: string;
  timestampText: string;
  textUk: string;
  textEn: string;
  tagUk: string;
  tagEn: string;
  category: 'ingestion' | 'pricing' | 'sync' | 'seo';
}

export interface FunnelStageItem {
  id: ShowcaseStageId;
  stepNumber: number;
  titleUk: string;
  titleEn: string;
  subtitleUk: string;
  subtitleEn: string;
  badgeUk: string;
  badgeEn: string;
  iconName: 'PackageCheck' | 'Rocket' | 'TrendingUp';
  statPrimaryUk: string;
  statPrimaryEn: string;
  statSecondaryUk: string;
  statSecondaryEn: string;
}

export interface LiveOrderItem {
  id: string;
  marketplace: 'Rozetka' | 'Prom' | 'Epicentr' | 'Shopify';
  productTitleUk: string;
  productTitleEn: string;
  amount: number;
  timeAgoUk: string;
  timeAgoEn: string;
}

export interface GrowthShowcaseConfig {
  autoPlay: boolean;
  cycleIntervalMs: number;
  timeline: RevenueGrowthPoint[];
  aiActions: AiActionLogItem[];
  stages: FunnelStageItem[];
  recentOrders: LiveOrderItem[];
}
