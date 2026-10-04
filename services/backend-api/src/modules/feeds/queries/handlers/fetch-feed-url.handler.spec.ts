import {
  BadRequestException,
  BadGatewayException,
  GatewayTimeoutException,
  NotFoundException,
} from '@nestjs/common';
import { FetchFeedUrlHandler } from '@/modules/feeds/queries/handlers/fetch-feed-url.handler';
import { FetchFeedUrlQuery } from '@/modules/feeds/queries/fetch-feed-url.query';

describe('FetchFeedUrlHandler (Unit)', () => {
  let handler: FetchFeedUrlHandler;

  beforeEach(() => {
    handler = new FetchFeedUrlHandler();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('SSRF & URL Safety Validation', () => {
    it('should reject non-http/https protocol (ftp://)', async () => {
      await expect(
        handler.execute(new FetchFeedUrlQuery('ftp://example.com/feed.xml')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject loopback localhost', async () => {
      await expect(
        handler.execute(new FetchFeedUrlQuery('http://localhost:4000/api/users')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject loopback IPv4 127.0.0.1', async () => {
      await expect(
        handler.execute(new FetchFeedUrlQuery('http://127.0.0.1:8080/feed.xml')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cloud metadata 169.254.169.254', async () => {
      await expect(
        handler.execute(new FetchFeedUrlQuery('http://169.254.169.254/latest/meta-data/')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject private 10.x.x.x addresses', async () => {
      await expect(
        handler.execute(new FetchFeedUrlQuery('http://10.0.0.5/feed.xml')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject private 192.168.x.x addresses', async () => {
      await expect(
        handler.execute(new FetchFeedUrlQuery('http://192.168.1.100/feed.xml')),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject private 172.16-31.x.x addresses', async () => {
      await expect(
        handler.execute(new FetchFeedUrlQuery('http://172.20.0.1/feed.xml')),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Remote Feed Fetching', () => {
    const mockXmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2026-10-04 12:00">
  <shop>
    <name>Sample Shop</name>
    <categories>
      <category id="1">Electronics</category>
    </categories>
    <offers>
      <offer id="101" available="true">
        <name>Sample Product</name>
        <price>499.00</price>
        <currencyId>UAH</currencyId>
        <categoryId>1</categoryId>
      </offer>
    </offers>
  </shop>
</yml_catalog>`;

    it('should successfully fetch XML feed from remote URL', async () => {
      const mockHeaders = new Headers({
        'content-type': 'application/xml; charset=utf-8',
        'content-length': String(mockXmlFeed.length),
      });

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        text: async () => mockXmlFeed,
      } as unknown as Response);

      const result = await handler.execute(
        new FetchFeedUrlQuery('https://example.com/feeds/products.xml'),
      );

      expect(result).toBeDefined();
      expect(typeof result.content).toBe('string');
      expect(result.content).toContain('<yml_catalog');
      expect(result.content).toContain('<categories>');
      expect(result.content).toContain('<offers>');
      expect(result.contentType).toContain('xml');
      expect(result.contentLength).toBe(mockXmlFeed.length);
    });

    it('should throw NotFoundException on HTTP 404 response', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers(),
      } as unknown as Response);

      await expect(
        handler.execute(new FetchFeedUrlQuery('https://example.com/non-existent-feed.xml')),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadGatewayException on HTTP 502 upstream error', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 502,
        headers: new Headers(),
      } as unknown as Response);

      await expect(
        handler.execute(new FetchFeedUrlQuery('https://example.com/broken-feed.xml')),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should throw GatewayTimeoutException on fetch timeout', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('The operation was aborted due to timeout'));

      await expect(
        handler.execute(new FetchFeedUrlQuery('https://example.com/timeout-feed.xml')),
      ).rejects.toThrow(GatewayTimeoutException);
    });
  });
});
