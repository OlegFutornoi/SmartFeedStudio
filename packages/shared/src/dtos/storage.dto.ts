import { z } from 'zod';

export const PresignedUrlRequestDtoSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  contentType: z.string().min(1, 'Content type is required'),
  folder: z.string().optional().default('images'),
});

export type PresignedUrlRequestDto = z.infer<typeof PresignedUrlRequestDtoSchema>;

export const PresignedUrlResponseDtoSchema = z.object({
  uploadUrl: z.string().url(),
  s3Key: z.string(),
  publicUrl: z.string().url().optional(),
  expiresInSeconds: z.number(),
});

export type PresignedUrlResponseDto = z.infer<typeof PresignedUrlResponseDtoSchema>;
