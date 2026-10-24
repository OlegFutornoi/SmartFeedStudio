import { z } from 'zod';
import { CurrencyCode, ExchangeRateMode, PriceRoundingMode } from '../enums/index.js';

export const CustomRoundingRuleTypeSchema = z.enum(['DECIMAL', 'INTEGER_ENDING', 'MULTIPLE']);
export type CustomRoundingRuleType = z.infer<typeof CustomRoundingRuleTypeSchema>;

export const CustomRoundingRuleDtoSchema = z.object({
  code: z.string().min(1),
  type: CustomRoundingRuleTypeSchema,
  value: z.number().min(0).max(10000),
  labelUk: z.string().optional(),
  labelEn: z.string().optional(),
});

export type CustomRoundingRuleDto = z.infer<typeof CustomRoundingRuleDtoSchema>;

export const PriceRoundingValueSchema = z.union([
  z.nativeEnum(PriceRoundingMode),
  z.string().min(1),
]);
export type PriceRoundingValue = PriceRoundingMode | string;

export const SupplierDtoSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullable().optional(),
  userId: z.string(),
  name: z.string().min(1, 'Supplier name is required'),
  code: z.string().min(1, 'Supplier code is required'),
  contactPhone: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  website: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),

  // CRM: Company & Business metadata
  legalName: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  segment: z.string().nullable().optional(),

  // CRM: Manager / Account owner
  managerName: z.string().nullable().optional(),
  managerPosition: z.string().nullable().optional(),
  managerPhone: z.string().nullable().optional(),
  managerEmail: z.string().email().nullable().optional().or(z.literal('')),
  managerTelegram: z.string().nullable().optional(),

  // CRM: Warehouse & Physical address
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),

  // Currency & Multi-Currency configuration
  baseCurrency: z.nativeEnum(CurrencyCode).default(CurrencyCode.UAH),
  targetCurrency: z.nativeEnum(CurrencyCode).default(CurrencyCode.UAH),
  exchangeRateMode: z.nativeEnum(ExchangeRateMode).default(ExchangeRateMode.MANUAL),
  exchangeRate: z.number().positive().default(1.0),
  currencyBufferPercent: z.number().min(0).max(100).default(0),
  priceRounding: PriceRoundingValueSchema.default(PriceRoundingMode.NONE),
  customRoundingRules: z.array(CustomRoundingRuleDtoSchema).default([]).optional(),

  // Default markups
  defaultMarginPercent: z.number().nonnegative().default(0),
  defaultFixedMarkup: z.number().nonnegative().default(0),

  isActive: z.boolean().default(true),
  productsCount: z.number().int().nonnegative().optional(),
  activeFeedsCount: z.number().int().nonnegative().optional(),
  categoriesCount: z.number().int().nonnegative().optional(),
  activeCategoriesCount: z.number().int().nonnegative().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type SupplierDto = z.infer<typeof SupplierDtoSchema>;

export const CreateSupplierDtoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, dashes and underscores'),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  logoUrl: z.string().nullable().optional(),

  // CRM: Company & Business metadata
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  industry: z.string().optional(),
  segment: z.string().optional(),

  // CRM: Manager / Account owner
  managerName: z.string().optional(),
  managerPosition: z.string().optional(),
  managerPhone: z.string().optional(),
  managerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  managerTelegram: z.string().optional(),

  // CRM: Warehouse & Physical address
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),

  baseCurrency: z.nativeEnum(CurrencyCode).default(CurrencyCode.UAH).optional(),
  targetCurrency: z.nativeEnum(CurrencyCode).default(CurrencyCode.UAH).optional(),
  exchangeRateMode: z.nativeEnum(ExchangeRateMode).default(ExchangeRateMode.MANUAL).optional(),
  exchangeRate: z.number().positive().default(1.0).optional(),
  currencyBufferPercent: z.number().min(0).max(100).default(0).optional(),
  priceRounding: PriceRoundingValueSchema.default(PriceRoundingMode.NONE).optional(),
  customRoundingRules: z.array(CustomRoundingRuleDtoSchema).optional(),

  defaultMarginPercent: z
    .number()
    .min(0, 'Margin percent cannot be negative')
    .default(0)
    .optional(),
  defaultFixedMarkup: z.number().min(0, 'Fixed markup cannot be negative').default(0).optional(),
  isActive: z.boolean().default(true).optional(),
});

export type CreateSupplierDto = z.infer<typeof CreateSupplierDtoSchema>;

export const UpdateSupplierDtoSchema = CreateSupplierDtoSchema.partial();

export type UpdateSupplierDto = z.infer<typeof UpdateSupplierDtoSchema>;
