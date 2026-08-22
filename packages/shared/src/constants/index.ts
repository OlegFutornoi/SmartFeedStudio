import { PlanType } from '../enums/index.js';
import { PlanLimits } from '../dtos/license.dto.js';

export const PLAN_LIMITS_MAP: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    planType: PlanType.FREE,
    maxXmlLimit: 1000,
    aiCredits: 50,
    canCloudBackup: false,
  },
  [PlanType.PRO]: {
    planType: PlanType.PRO,
    maxXmlLimit: 50000,
    aiCredits: 500,
    canCloudBackup: true,
  },
  [PlanType.ENTERPRISE]: {
    planType: PlanType.ENTERPRISE,
    maxXmlLimit: 1000000,
    aiCredits: 5000,
    canCloudBackup: true,
  },
};

export const S3_FOLDERS = {
  SNAPSHOTS: 'snapshots',
  IMAGES: 'images',
  FEEDS: 'feeds',
} as const;
