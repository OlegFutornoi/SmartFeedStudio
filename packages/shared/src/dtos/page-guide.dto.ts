import { z } from 'zod';

/**
 * AI Assistant Profile Schema (Single Source of Truth for avatar and metadata)
 */
export const AiAssistantProfileDtoSchema = z.object({
  name: z.string().default('SmartFeed AI Copilot'),
  avatarUrl: z.string().optional(),
  roleUk: z.string().default('Персональний AI-асистент з товарних каталогів та фідів'),
  roleEn: z.string().default('Personal AI Catalog & Feed Copilot'),
  badgeUk: z.string().default('AI Автопілот 24/7'),
  badgeEn: z.string().default('24/7 AI Autopilot'),
});

export type AiAssistantProfileDto = z.infer<typeof AiAssistantProfileDtoSchema>;

export const UpdateAiAssistantProfileDtoSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  roleUk: z.string().min(1).optional(),
  roleEn: z.string().min(1).optional(),
  badgeUk: z.string().min(1).optional(),
  badgeEn: z.string().min(1).optional(),
});

export type UpdateAiAssistantProfileDto = z.infer<typeof UpdateAiAssistantProfileDtoSchema>;

/**
 * Page Guide DTO Schema for contextual AI assistance on any page
 */
export const PageGuideDtoSchema = z.object({
  id: z.string().optional(),
  route: z.string(), // e.g. "/cloud-sync", "/catalogs", "/suppliers", "/ai", "/"
  titleUk: z.string(),
  titleEn: z.string(),
  icon: z.string().default('HelpCircle'),
  badgeUk: z.string().default('AI Асистент'),
  badgeEn: z.string().default('AI Assistant'),
  summaryUk: z.string(),
  summaryEn: z.string(),
  descriptionUk: z.string(),
  descriptionEn: z.string(),
  featuresUk: z.array(z.string()).default([]),
  featuresEn: z.array(z.string()).default([]),
  proTipUk: z.string().optional(),
  proTipEn: z.string().optional(),
  assistant: AiAssistantProfileDtoSchema.optional(),
});

export type PageGuideDto = z.infer<typeof PageGuideDtoSchema>;

export { DEFAULT_AI_ASSISTANT_PROFILE, DEFAULT_PAGE_GUIDES } from './page-guide-defaults';
