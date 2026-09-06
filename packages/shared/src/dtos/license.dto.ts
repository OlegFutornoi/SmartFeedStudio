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

export const AssignLicenseDtoSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  planType: z.nativeEnum(PlanType),
});

export type AssignLicenseDto = z.infer<typeof AssignLicenseDtoSchema>;

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

export const QuotaItemDtoSchema = z.object({
  used: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  isUnlimited: z.boolean(),
  percentUsed: z.number().nonnegative(),
  isExceeded: z.boolean(),
  remaining: z.number().int().nonnegative(),
});

export type QuotaItemDto = z.infer<typeof QuotaItemDtoSchema>;

export const UserQuotasDtoSchema = z.object({
  planCode: z.string(),
  planNameUk: z.string(),
  planNameEn: z.string(),
  isExpired: z.boolean(),
  suppliers: QuotaItemDtoSchema,
  products: QuotaItemDtoSchema,
  feeds: QuotaItemDtoSchema,
  channels: QuotaItemDtoSchema,
  teamSeats: QuotaItemDtoSchema,
  aiCredits: QuotaItemDtoSchema,
  storage: QuotaItemDtoSchema.extend({
    usedBytes: z.number().nonnegative(),
    maxBytes: z.number().nonnegative(),
    canCloudBackup: z.boolean(),
  }),
});

export type UserQuotasDto = z.infer<typeof UserQuotasDtoSchema>;
