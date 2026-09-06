import { PlanType } from '@smartfeed/shared';

export type FeatureTeaserKey = 'team' | 'cloud_sync' | string;

export interface FeatureBenefitItem {
  id: string;
  iconName: string;
  titleKey: string;
  descKey: string;
}

export interface FeatureRoiConfig {
  defaultHours: number;
  minHours: number;
  maxHours: number;
  hourlyRateUah: number;
  efficiencyMultiplier: number;
}

export interface FeatureTeaserConfig {
  key: FeatureTeaserKey;
  path: string;
  icon: string;
  minPlan: PlanType;
  badge: string;
  targetPriceMonthly: number;
  heroBadgeKey: string;
  heroTitleKey: string;
  heroSubtitleKey: string;
  benefitsTitleKey: string;
  benefits: FeatureBenefitItem[];
  mockupType: 'team' | 'cloud_sync' | 'ai_enrichment';
  roiConfig?: FeatureRoiConfig;
  comparison: {
    titleKey: string;
    starterTitleKey: string;
    targetTitleKey: string;
    starterFeaturesKeys: string[];
    targetFeaturesKeys: string[];
  };
  cta: {
    titleKey: string;
    buttonKey: string;
    priceTextKey: string;
  };
}

export interface FeatureAccessResult {
  isLocked: boolean;
  isAllowed: boolean;
  reason:
    | 'ADMIN'
    | 'HAS_ORGANIZATION'
    | 'PLAN_LEVEL_INSUFFICIENT'
    | 'NO_CLOUD_BACKUP'
    | 'ALLOWED'
    | 'PREVIEW_FORCED';
  currentPlan: PlanType;
  minPlan: PlanType;
  config?: FeatureTeaserConfig;
}
