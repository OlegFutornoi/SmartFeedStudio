import { z } from 'zod';
import { PlanType } from '../enums/index.js';

export const LicenseDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  licenseKey: z.string(),
  planType: z.nativeEnum(PlanType),
  canCloudBackup: z.boolean(),
  maxXmlLimit: z.number().int().positive(),
  aiCredits: z.number().int().nonnegative(),
  isActive: z.boolean(),
  expiresAt: z.date().nullable().optional(),
  isExpired: z.boolean().optional(),
  daysRemaining: z.number().nullable().optional(),
  tariffPlan: z.any().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LicenseDto = z.infer<typeof LicenseDtoSchema>;

export const UpgradeLicenseDtoSchema = z.object({
  userId: z.string().uuid(),
  planType: z.nativeEnum(PlanType),
  expiresAt: z.string().datetime().optional(),
});

export type UpgradeLicenseDto = z.infer<typeof UpgradeLicenseDtoSchema>;

export const SelectTariffPlanDtoSchema = z.object({
  planCode: z.string().min(1, 'Plan code is required'),
  billingInterval: z.enum(['monthly', 'yearly']).optional().default('monthly'),
});

export type SelectTariffPlanDto = z.infer<typeof SelectTariffPlanDtoSchema>;

export interface PlanLimits {
  planType: PlanType;
  maxXmlLimit: number;
  aiCredits: number;
  canCloudBackup: boolean;
  maxFeedsLimit: number;
  maxChannelsLimit: number;
  maxTeamSeats: number;
  maxSuppliersLimit: number;
  hasApiAccess: boolean;
  hasFeedDiff: boolean;
  hasWhiteLabel: boolean;
  hasSso: boolean;
  hasAuditLog: boolean;
}
