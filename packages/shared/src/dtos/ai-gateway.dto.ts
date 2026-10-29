export interface ClassifyCategoryDto {
  title: string;
  description?: string;
  availableCategories: string[];
}

export interface ClassifyCategoryResultDto {
  category: string;
  confidence: number;
  reasoning?: string;
}

export interface EnrichProductAttributesDto {
  title: string;
  rawDescription?: string;
  existingAttributes?: Record<string, string>;
}

export interface EnrichProductAttributesResultDto {
  attributes: Record<string, string>;
  tags: string[];
  keyFeatures: string[];
}

export interface GenerateProductDescriptionDto {
  title: string;
  attributes?: Record<string, string>;
  tone?: 'marketing' | 'formal' | 'concise';
  locale?: 'uk' | 'en';
}

export interface GenerateProductDescriptionResultDto {
  title: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
}

export interface AiGatewayHealthDto {
  status: 'ok' | 'degraded' | 'offline';
  gatewayUrl: string;
  provider: string;
  latencyMs: number;
  activeModel?: string;
}

export interface AiGatewayCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
  userId?: string;
  creditsCost?: number;
}
