import { z } from 'zod';

export const LegalDocumentSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  titleUk: z.string().min(1),
  titleEn: z.string().min(1),
  contentUk: z.string().min(1),
  contentEn: z.string().min(1),
  isPublished: z.boolean().default(true),
  version: z.string().default('2.0'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type LegalDocumentDto = z.infer<typeof LegalDocumentSchema>;

export const CreateLegalDocumentSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9_-]+$/, 'Slug must be alphanumeric, hyphen or underscore'),
  titleUk: z.string().min(1, 'Ukrainian title is required'),
  titleEn: z.string().min(1, 'English title is required'),
  contentUk: z.string().min(1, 'Ukrainian content is required'),
  contentEn: z.string().min(1, 'English content is required'),
  isPublished: z.boolean().default(true),
  version: z.string().default('2.0'),
});

export type CreateLegalDocumentDto = z.infer<typeof CreateLegalDocumentSchema>;

export const UpdateLegalDocumentSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  titleUk: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  contentUk: z.string().min(1).optional(),
  contentEn: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
  version: z.string().optional(),
});

export type UpdateLegalDocumentDto = z.infer<typeof UpdateLegalDocumentSchema>;
