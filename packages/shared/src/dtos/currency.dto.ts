import { z } from 'zod';
import { CurrencyCode } from '../enums';

export const BankProviderConfigDtoSchema = z.object({
  id: z.string(),
  bankId: z.string(), // 'nbu', 'privat', 'mono', 'raiffeisen', 'pumb'
  bankName: z.string(),
  badge: z.string(),
  logoUrl: z.string().nullable().optional(),
  isEnabled: z.boolean(),
  isDefault: z.boolean(),
  sourceType: z.enum(['API_DIRECT', 'COMMERCIAL_SPREAD', 'MANUAL']),
  sellSpreadPercent: z.number(),
  buySpreadPercent: z.number(),
  sortOrder: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BankProviderConfigDto = z.infer<typeof BankProviderConfigDtoSchema>;

export const UpdateBankProviderDtoSchema = z.object({
  bankName: z.string().min(1).optional(),
  badge: z.string().min(1).optional(),
  logoUrl: z.string().nullable().optional(),
  isEnabled: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sourceType: z.enum(['API_DIRECT', 'COMMERCIAL_SPREAD', 'MANUAL']).optional(),
  sellSpreadPercent: z.number().min(-10).max(30).optional(),
  buySpreadPercent: z.number().min(-30).max(10).optional(),
  sortOrder: z.number().optional(),
});

export type UpdateBankProviderDto = z.infer<typeof UpdateBankProviderDtoSchema>;

export const LiveBankRateDtoSchema = z.object({
  bankId: z.string(),
  bankName: z.string(),
  badge: z.string(),
  logoUrl: z.string().nullable().optional(),
  currency: z.nativeEnum(CurrencyCode),
  buyRate: z.number(),
  sellRate: z.number(),
  deltaNbu: z.number(),
  deltaPercent: z.number(),
  updatedAt: z.string(),
  isDefault: z.boolean().optional(),
});

export type LiveBankRateDto = z.infer<typeof LiveBankRateDtoSchema>;
