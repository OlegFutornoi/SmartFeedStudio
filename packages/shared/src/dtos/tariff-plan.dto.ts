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
  maxXmlLimit: z.number().int().positive(),
  aiCredits: z.number().int().nonnegative(),
  canCloudBackup: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
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
  maxXmlLimit: z.number().int().positive(),
  aiCredits: z.number().int().nonnegative(),
  canCloudBackup: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
  featuresUk: z.array(z.string()).default([]),
  featuresEn: z.array(z.string()).default([]),
});

export type CreateTariffPlanDto = z.infer<typeof CreateTariffPlanDtoSchema>;

export const UpdateTariffPlanDtoSchema = CreateTariffPlanDtoSchema.partial();

export type UpdateTariffPlanDto = z.infer<typeof UpdateTariffPlanDtoSchema>;

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
