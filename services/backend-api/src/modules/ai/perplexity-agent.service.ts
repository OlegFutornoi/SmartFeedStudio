import {
  Injectable,
  Logger,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type Perplexity from '@perplexity-ai/perplexity_ai';

export interface PerplexitySearchResultItem {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export interface PerplexityJsonSchemaFormat {
  name: string;
  schema: Record<string, unknown>;
  description?: string;
  strict?: boolean;
}

export interface PerplexityAgentOptions {
  preset?: 'low' | 'medium';
  model?: string;
  tools?: Array<{ type: string; [key: string]: unknown }>;
  previousResponseId?: string;
  responseFormat?: PerplexityJsonSchemaFormat;
  instructions?: string;
}

export interface PerplexityAgentResponse {
  id: string;
  model: string;
  outputText: string;
  citations: string[];
  searchResults: PerplexitySearchResultItem[];
  totalCost?: number;
}

@Injectable()
export class PerplexityAgentService {
  private readonly logger = new Logger(PerplexityAgentService.name);
  private clientInstance: Perplexity | null = null;

  constructor(private readonly configService: ConfigService) {}

  private async getClient(): Promise<Perplexity> {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    const apiKey =
      this.configService.get<string>('PERPLEXITY_API_KEY') || process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      throw new UnauthorizedException(
        'PERPLEXITY_API_KEY environment variable is not configured. Create an API key in the Perplexity API Console.',
      );
    }

    try {
      // Dynamic import to support ESM package inside CommonJS NestJS build
      const { default: Perplexity } = await import('@perplexity-ai/perplexity_ai');
      this.clientInstance = new Perplexity({ apiKey });
      return this.clientInstance;
    } catch (err: unknown) {
      this.logger.error('[PerplexityAgentService] Failed to initialize Perplexity SDK:', err);
      throw new BadGatewayException('Failed to load official Perplexity SDK runtime');
    }
  }

  async searchAndAnswer(
    query: string,
    options: PerplexityAgentOptions = {},
  ): Promise<PerplexityAgentResponse> {
    const client = await this.getClient();

    type RequestBody = Parameters<Perplexity['responses']['create']>[0];

    const requestPayload: RequestBody = {
      input: query,
    };

    if (options.preset) {
      requestPayload.preset = options.preset;
    } else if (options.model) {
      requestPayload.model = options.model;
    } else {
      requestPayload.preset = 'low';
    }

    if (options.tools) {
      requestPayload.tools = options.tools as RequestBody['tools'];
    } else if (!options.preset) {
      requestPayload.tools = [{ type: 'web_search' }];
    }

    if (options.previousResponseId) {
      requestPayload.previous_response_id = options.previousResponseId;
    }

    if (options.responseFormat) {
      requestPayload.response_format = {
        type: 'json_schema',
        json_schema: options.responseFormat,
      };
    }

    if (options.instructions) {
      requestPayload.instructions = options.instructions;
    }

    try {
      const response = await client.responses.create({
        ...requestPayload,
        stream: false,
      });

      const searchResults: PerplexitySearchResultItem[] = [];
      const citations: string[] = [];

      if (Array.isArray(response.output)) {
        for (const outItem of response.output) {
          if ('results' in outItem && Array.isArray((outItem as { results?: unknown[] }).results)) {
            const resultsList = (
              outItem as {
                results: Array<{ title?: string; url?: string; snippet?: string; date?: string }>;
              }
            ).results;
            for (const r of resultsList) {
              if (r.url && r.title) {
                searchResults.push({
                  title: String(r.title),
                  url: String(r.url),
                  snippet: String(r.snippet || ''),
                  date: r.date ? String(r.date) : undefined,
                });
              }
            }
          }
          if ('content' in outItem && Array.isArray((outItem as { content?: unknown[] }).content)) {
            const contentList = (
              outItem as { content: Array<{ annotations?: Array<{ url?: string }> }> }
            ).content;
            for (const c of contentList) {
              if (Array.isArray(c.annotations)) {
                for (const a of c.annotations) {
                  if (a.url) {
                    citations.push(String(a.url));
                  }
                }
              }
            }
          }
        }
      }

      return {
        id: response.id,
        model: response.model || (options.model ?? 'preset-default'),
        outputText: response.output_text || '',
        citations: Array.from(new Set(citations)),
        searchResults,
        totalCost: response.usage?.cost?.total_cost,
      };
    } catch (err: unknown) {
      const errorObj = err as {
        status?: number;
        statusCode?: number;
        message?: string;
        headers?: Record<string, string>;
      };
      const status = errorObj.status || errorObj.statusCode;
      this.logger.warn(
        `[PerplexityAgentService] API call failed with status ${status}:`,
        errorObj.message,
      );

      if (status === 401) {
        throw new UnauthorizedException(
          'Perplexity API key authentication failed. Verify PERPLEXITY_API_KEY in the API Console.',
        );
      }

      if (status === 429) {
        const retryAfter = errorObj.headers?.['retry-after'] || '60';
        throw new HttpException(
          `Perplexity API rate limit or model capacity reached. Retry after ${retryAfter}s.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (status && status >= 500) {
        throw new BadGatewayException(
          `Perplexity upstream service error (${status}): ${errorObj.message || 'Service Unavailable'}`,
        );
      }

      throw new HttpException(
        errorObj.message || 'Perplexity Agent request failed',
        status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
