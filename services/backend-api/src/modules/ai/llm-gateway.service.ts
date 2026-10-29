import {
  Injectable,
  Logger,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ClassifyCategoryDto,
  ClassifyCategoryResultDto,
  EnrichProductAttributesDto,
  EnrichProductAttributesResultDto,
  GenerateProductDescriptionDto,
  GenerateProductDescriptionResultDto,
  AiGatewayHealthDto,
  AiGatewayCompletionOptions,
} from '@smartfeed/shared';

interface OpenAiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAiChatCompletionResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);

  constructor(private readonly configService: ConfigService) {}

  private getBaseUrl(): string {
    const headroomEnabled =
      this.configService.get<string>('HEADROOM_ENABLED') !== 'false' &&
      process.env.HEADROOM_ENABLED !== 'false';
    const headroomUrl =
      this.configService.get<string>('HEADROOM_BASE_URL') || process.env.HEADROOM_BASE_URL;

    if (headroomEnabled && headroomUrl) {
      return headroomUrl.replace(/\/+$/, '');
    }

    const raw =
      this.configService.get<string>('OMNIROUTE_BASE_URL') ||
      process.env.OMNIROUTE_BASE_URL ||
      'http://localhost:20128/v1';
    return raw.replace(/\/+$/, '');
  }

  private getApiKey(): string {
    return (
      this.configService.get<string>('OMNIROUTE_API_KEY') || process.env.OMNIROUTE_API_KEY || ''
    );
  }

  private getDefaultModel(): string {
    return (
      this.configService.get<string>('OMNIROUTE_DEFAULT_MODEL') ||
      process.env.OMNIROUTE_DEFAULT_MODEL ||
      'auto'
    );
  }

  async checkHealth(): Promise<AiGatewayHealthDto> {
    const baseUrl = this.getBaseUrl();
    const start = Date.now();

    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        this.logger.warn(`OmniRoute healthcheck failed with HTTP ${response.status}`);
        return {
          status: 'degraded',
          gatewayUrl: baseUrl,
          provider: 'omniroute',
          latencyMs,
        };
      }

      return {
        status: 'ok',
        gatewayUrl: baseUrl,
        provider: baseUrl.includes('8787') ? 'headroom-omniroute' : 'omniroute',
        latencyMs,
        activeModel: this.getDefaultModel(),
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`OmniRoute healthcheck offline: ${message}`);
      return {
        status: 'offline',
        gatewayUrl: baseUrl,
        provider: 'omniroute',
        latencyMs,
      };
    }
  }

  async executeCompletion(
    messages: OpenAiChatMessage[],
    options?: AiGatewayCompletionOptions,
  ): Promise<string> {
    const baseUrl = this.getBaseUrl();
    const model = options?.model || this.getDefaultModel();
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    };

    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 1500,
    };

    if (options?.responseFormatJson) {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.error(`OmniRoute completion returned HTTP ${res.status}: ${errorText}`);
        throw new BadGatewayException(`OmniRoute gateway error: HTTP ${res.status}`);
      }

      const body = (await res.json()) as OpenAiChatCompletionResponse;
      const content = body.choices?.[0]?.message?.content?.trim();

      if (!content) {
        this.logger.warn('Empty completion content received from OmniRoute');
        throw new BadGatewayException('Empty completion payload from LLM gateway');
      }

      return content;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to connect to OmniRoute: ${msg}`);
      throw new ServiceUnavailableException(`OmniRoute service unreachable: ${msg}`);
    }
  }

  async classifyCategory(dto: ClassifyCategoryDto): Promise<ClassifyCategoryResultDto> {
    const systemPrompt =
      'You are an e-commerce catalog categorization engine. Given a product title, description, and list of categories, return strictly JSON with { "category": string, "confidence": number, "reasoning": string }.';
    const userPrompt = `Product Title: ${dto.title}\nDescription: ${dto.description || 'N/A'}\nAllowed Categories:\n${dto.availableCategories.map((c) => `- ${c}`).join('\n')}`;

    const rawJson = await this.executeCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { responseFormatJson: true, temperature: 0.1 },
    );

    try {
      const parsed = JSON.parse(rawJson) as Partial<ClassifyCategoryResultDto>;
      return {
        category: parsed.category || dto.availableCategories[0] || 'General',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        reasoning: parsed.reasoning || 'Classified via OmniRoute engine',
      };
    } catch {
      this.logger.warn(`Failed to parse category JSON response: ${rawJson}`);
      return {
        category: dto.availableCategories[0] || 'General',
        confidence: 0.5,
        reasoning: 'Fallback classification due to raw JSON parsing error',
      };
    }
  }

  async enrichProductAttributes(
    dto: EnrichProductAttributesDto,
  ): Promise<EnrichProductAttributesResultDto> {
    const systemPrompt =
      'Extract key product attributes, tags, and features from product details. Return strictly JSON with { "attributes": Record<string, string>, "tags": string[], "keyFeatures": string[] }.';
    const userPrompt = `Title: ${dto.title}\nRaw Description: ${dto.rawDescription || 'N/A'}\nExisting Attributes: ${JSON.stringify(dto.existingAttributes || {})}`;

    const rawJson = await this.executeCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { responseFormatJson: true, temperature: 0.2 },
    );

    try {
      const parsed = JSON.parse(rawJson) as Partial<EnrichProductAttributesResultDto>;
      return {
        attributes:
          parsed.attributes && typeof parsed.attributes === 'object' ? parsed.attributes : {},
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [],
      };
    } catch {
      this.logger.warn(`Failed to parse attributes JSON: ${rawJson}`);
      return {
        attributes: dto.existingAttributes || {},
        tags: [],
        keyFeatures: [],
      };
    }
  }

  async generateProductDescription(
    dto: GenerateProductDescriptionDto,
  ): Promise<GenerateProductDescriptionResultDto> {
    const locale = dto.locale || 'uk';
    const tone = dto.tone || 'marketing';
    const systemPrompt = `You are a professional Ukrainian/English e-commerce copywriter. Write a compelling, SEO-optimized product title, description, and meta description in ${locale === 'uk' ? 'Ukrainian' : 'English'} with tone ${tone}. Return strictly JSON with { "title": string, "description": string, "seoTitle": string, "metaDescription": string }.`;
    const userPrompt = `Current Title: ${dto.title}\nAttributes: ${JSON.stringify(dto.attributes || {})}`;

    const rawJson = await this.executeCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { responseFormatJson: true, temperature: 0.4 },
    );

    try {
      const parsed = JSON.parse(rawJson) as Partial<GenerateProductDescriptionResultDto>;
      return {
        title: parsed.title || dto.title,
        description: parsed.description || dto.title,
        seoTitle: parsed.seoTitle || dto.title,
        metaDescription: parsed.metaDescription || dto.title,
      };
    } catch {
      this.logger.warn(`Failed to parse description JSON: ${rawJson}`);
      return {
        title: dto.title,
        description: dto.title,
        seoTitle: dto.title,
        metaDescription: dto.title,
      };
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const apiKey = this.getApiKey();
    return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
  }
}
