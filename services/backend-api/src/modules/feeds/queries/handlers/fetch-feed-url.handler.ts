import {
  BadRequestException,
  BadGatewayException,
  GatewayTimeoutException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { FetchFeedResultDto } from '@smartfeed/shared';
import { FetchFeedUrlQuery } from '@/modules/feeds/queries/fetch-feed-url.query';

const MAX_FEED_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB limit
const FETCH_TIMEOUT_MS = 60_000; // 60 seconds

@QueryHandler(FetchFeedUrlQuery)
export class FetchFeedUrlHandler implements IQueryHandler<FetchFeedUrlQuery, FetchFeedResultDto> {
  private readonly logger = new Logger(FetchFeedUrlHandler.name);

  async execute(query: FetchFeedUrlQuery): Promise<FetchFeedResultDto> {
    const rawUrl = query.url.trim();
    this.validateUrlSafety(rawUrl);

    this.logger.log(`Fetching remote feed from URL: ${rawUrl}`);

    try {
      const response = await fetch(rawUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SmartFeedStudio/1.0',
          Accept:
            'application/xml, text/xml, application/xhtml+xml, text/csv, text/plain, */*;q=0.8',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (response.status === 404) {
        throw new NotFoundException('Feed URL not found on remote server (HTTP 404)');
      }

      if (response.status === 504) {
        throw new GatewayTimeoutException(
          'Supplier server timed out while generating feed (HTTP 504)',
        );
      }

      if (response.status >= 500) {
        throw new BadGatewayException(
          `Supplier server returned an error (HTTP ${response.status})`,
        );
      }

      if (!response.ok) {
        throw new BadRequestException(
          `Remote server returned unexpected HTTP status: ${response.status}`,
        );
      }

      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > MAX_FEED_SIZE_BYTES) {
        throw new BadRequestException('Remote feed exceeds maximum supported size (50MB)');
      }

      const text = await response.text();
      if (!text || text.trim().length < 10) {
        throw new BadRequestException('Remote server returned an empty feed response');
      }

      const contentType = response.headers.get('content-type') || 'application/xml; charset=utf-8';

      return {
        content: text,
        contentType,
        contentLength: text.length,
      };
    } catch (err: unknown) {
      if (
        err instanceof NotFoundException ||
        err instanceof GatewayTimeoutException ||
        err instanceof BadGatewayException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }

      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Remote feed fetch failed for URL ${rawUrl}: ${errorMsg}`);

      if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        throw new GatewayTimeoutException('Timeout connecting to feed server (exceeded 60s)');
      }

      throw new BadGatewayException(`Failed to connect to feed server: ${errorMsg}`);
    }
  }

  /**
   * SSRF Protection: blocks private/loopback/cloud-metadata networks
   */
  private validateUrlSafety(targetUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException('Only HTTP and HTTPS protocols are permitted');
    }

    const hostname = parsed.hostname.toLowerCase();

    // Loopback & local
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      throw new BadRequestException('Requests to local addresses are prohibited');
    }

    // AWS metadata / Link-local
    if (hostname === '169.254.169.254' || hostname.startsWith('169.254.')) {
      throw new BadRequestException('Requests to link-local addresses are prohibited');
    }

    // Private IPv4 ranges
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      throw new BadRequestException('Requests to private network addresses are prohibited');
    }
  }
}
