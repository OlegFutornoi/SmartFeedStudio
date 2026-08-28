import { z } from 'zod';

export const TariffPlanDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(2).max(50),
  nameUk: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  descriptionUk: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  priceMonthly: z.number().nonnegative(),
  priceYearly: z.number().nonnegative().nullable().optional(),
  currency: z.string().default('USD'),

  // Quota fields
  maxXmlLimit: z.number().int().nonnegative(),
  aiCredits: z.number().int().nonnegative(),
  canCloudBackup: z.boolean().default(false),
  maxFeedsLimit: z.number().int().nonnegative().default(1),
  maxChannelsLimit: z.number().int().nonnegative().default(1),
  syncFrequencyHours: z.number().int().nonnegative().default(0),
  maxStorageGb: z.number().nonnegative().default(0),
  maxTeamSeats: z.number().int().positive().default(1),
  maxSuppliersLimit: z.number().int().positive().default(1),

  // Feature flags
  hasApiAccess: z.boolean().default(false),
  hasWebhooks: z.boolean().default(false),
  hasFeedDiff: z.boolean().default(false),
  hasWhiteLabel: z.boolean().default(false),
  hasSso: z.boolean().default(false),
  hasAuditLog: z.boolean().default(false),
  hasCustomS3: z.boolean().default(false),
  hasPriorityAi: z.boolean().default(false),
  slaUptimePercent: z.number().nullable().optional(),

  // Display fields
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
  durationDays: z.number().int().positive().nullable().optional().default(7),
  featuresUk: z.array(z.string()).default([]),
  featuresEn: z.array(z.string()).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type TariffPlanDto = z.infer<typeof TariffPlanDtoSchema>;

export const CreateTariffPlanDtoSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, {
      message: 'Code must be uppercase alphanumeric with underscores or dashes',
    }),
  nameUk: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  descriptionUk: z.string().optional(),
  descriptionEn: z.string().optional(),
  priceMonthly: z.number().nonnegative().default(0),
  priceYearly: z.number().nonnegative().optional(),
  currency: z.string().default('USD'),

  // Quota fields
  maxXmlLimit: z.number().int().nonnegative().default(500),
  aiCredits: z.number().int().nonnegative().default(0),
  canCloudBackup: z.boolean().default(false),
  maxFeedsLimit: z.number().int().nonnegative().default(1),
  maxChannelsLimit: z.number().int().nonnegative().default(1),
  syncFrequencyHours: z.number().int().nonnegative().default(0),
  maxStorageGb: z.number().nonnegative().default(0),
  maxTeamSeats: z.number().int().positive().default(1),
  maxSuppliersLimit: z.number().int().positive().default(1),

  // Feature flags
  hasApiAccess: z.boolean().default(false),
  hasWebhooks: z.boolean().default(false),
  hasFeedDiff: z.boolean().default(false),
  hasWhiteLabel: z.boolean().default(false),
  hasSso: z.boolean().default(false),
  hasAuditLog: z.boolean().default(false),
  hasCustomS3: z.boolean().default(false),
  hasPriorityAi: z.boolean().default(false),
  slaUptimePercent: z.number().nullable().optional(),

  // Display fields
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
  durationDays: z.number().int().positive().nullable().optional().default(7),
  featuresUk: z.array(z.string()).default([]),
  featuresEn: z.array(z.string()).default([]),
});

export type CreateTariffPlanDto = z.infer<typeof CreateTariffPlanDtoSchema>;

export const UpdateTariffPlanDtoSchema = CreateTariffPlanDtoSchema.partial();
export type UpdateTariffPlanDto = z.infer<typeof UpdateTariffPlanDtoSchema>;

export type BillingInterval = 'monthly' | 'yearly';

export interface AdminLicenseItemDto {
  id: string;
  userId: string;
  licenseKey: string;
  planType: string;
  tariffPlanId?: string | null;
  tariffPlanNameUk?: string | null;
  tariffPlanNameEn?: string | null;
  canCloudBackup: boolean;
  maxXmlLimit: number;
  aiCredits: number;
  maxFeedsLimit: number;
  maxChannelsLimit: number;
  maxTeamSeats: number;
  maxSuppliersLimit: number;
  hasApiAccess: boolean;
  hasFeedDiff: boolean;
  hasWhiteLabel: boolean;
  hasSso: boolean;
  hasAuditLog: boolean;
  isActive: boolean;
  expiresAt: string | Date | null;
  createdAt: string | Date;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
  };
}
