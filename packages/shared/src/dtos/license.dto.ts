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

export interface PlanLimits {
  planType: PlanType;
  maxXmlLimit: number;
  aiCredits: number;
  canCloudBackup: boolean;
}
