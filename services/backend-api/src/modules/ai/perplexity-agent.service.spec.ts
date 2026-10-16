import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { PerplexityAgentService } from '@/modules/ai/perplexity-agent.service';

describe('PerplexityAgentService', () => {
  let service: PerplexityAgentService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerplexityAgentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PERPLEXITY_API_KEY') {
                return 'test_mock_api_key';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PerplexityAgentService>(PerplexityAgentService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw UnauthorizedException when PERPLEXITY_API_KEY is missing', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(null);
    const origKey = process.env.PERPLEXITY_API_KEY;
    delete process.env.PERPLEXITY_API_KEY;

    try {
      await expect(service.searchAndAnswer('test query')).rejects.toThrow(UnauthorizedException);
    } finally {
      process.env.PERPLEXITY_API_KEY = origKey;
    }
  });

  it('should parse output text, annotations, and search results correctly', async () => {
    const mockClient = {
      responses: {
        create: jest.fn().mockResolvedValue({
          id: 'resp_mock_123',
          model: 'openai/gpt-5.6-sol',
          output_text: 'Rozetka requires XML feed with price, stock, and vendor code.',
          output: [
            {
              results: [
                {
                  title: 'Rozetka Feed Requirements',
                  url: 'https://seller.rozetka.com.ua/docs/xml-feed',
                  snippet: 'Official XML format specifications for sellers',
                  date: '2026-01-15',
                },
              ],
              content: [
                {
                  annotations: [
                    {
                      url: 'https://seller.rozetka.com.ua/docs/xml-feed',
                    },
                  ],
                },
              ],
            },
          ],
          usage: {
            cost: {
              total_cost: 0.003,
            },
          },
        }),
      },
    };

    // Inject mock client directly
    (service as unknown as { clientInstance: unknown }).clientInstance = mockClient;

    const result = await service.searchAndAnswer('Rozetka XML requirements');

    expect(result.id).toBe('resp_mock_123');
    expect(result.outputText).toContain('Rozetka requires XML');
    expect(result.searchResults).toHaveLength(1);
    expect(result.searchResults[0].url).toBe('https://seller.rozetka.com.ua/docs/xml-feed');
    expect(result.citations).toContain('https://seller.rozetka.com.ua/docs/xml-feed');
    expect(result.totalCost).toBe(0.003);
  });

  it('should handle 429 rate limit with Retry-After', async () => {
    const mockClient = {
      responses: {
        create: jest.fn().mockRejectedValue({
          status: 429,
          headers: { 'retry-after': '30' },
          message: 'Rate limit exceeded',
        }),
      },
    };

    (service as unknown as { clientInstance: unknown }).clientInstance = mockClient;

    try {
      await service.searchAndAnswer('overloaded query');
      fail('Expected HttpException 429');
    } catch (err: unknown) {
      const httpErr = err as HttpException;
      expect(httpErr).toBeInstanceOf(HttpException);
      expect(httpErr.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(httpErr.message).toContain('Retry after 30s');
    }
  });
});
