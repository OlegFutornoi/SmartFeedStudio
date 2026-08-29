import { z } from 'zod';

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
  defaultMarginPercent: z.number().nonnegative().default(0),
  defaultFixedMarkup: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
  productsCount: z.number().int().nonnegative().optional(),
  activeFeedsCount: z.number().int().nonnegative().optional(),
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
  defaultMarginPercent: z.number().min(0, 'Margin percent cannot be negative').default(0),
  defaultFixedMarkup: z.number().min(0, 'Fixed markup cannot be negative').default(0),
  isActive: z.boolean().default(true).optional(),
});

export type CreateSupplierDto = z.infer<typeof CreateSupplierDtoSchema>;

export const UpdateSupplierDtoSchema = CreateSupplierDtoSchema.partial();

export type UpdateSupplierDto = z.infer<typeof UpdateSupplierDtoSchema>;
