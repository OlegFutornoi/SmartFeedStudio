import * as dns from 'dns';
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
    let currentUrl = query.url.trim();
    let redirectCount = 0;
    const MAX_REDIRECTS = 3;

    try {
      while (redirectCount <= MAX_REDIRECTS) {
        await this.validateUrlSafety(currentUrl);

        this.logger.log(`Fetching remote feed from URL: ${currentUrl}`);

        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SmartFeedStudio/1.0',
            Accept:
              'application/xml, text/xml, application/xhtml+xml, text/csv, text/plain, */*;q=0.8',
          },
          redirect: 'manual',
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });

        // SEC-03: Validate redirect targets against SSRF & loopback address bypasses
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) {
            throw new BadRequestException('Redirect response missing Location header');
          }
          redirectCount++;
          if (redirectCount > MAX_REDIRECTS) {
            throw new BadRequestException('Too many redirects while fetching remote feed');
          }
          const nextUrl = new URL(location, currentUrl).toString();
          currentUrl = nextUrl;
          continue;
        }

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

        const contentType =
          response.headers.get('content-type') || 'application/xml; charset=utf-8';

        return {
          content: text,
          contentType,
          contentLength: text.length,
        };
      }

      throw new BadRequestException('Exceeded maximum allowed redirects (3)');
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
      this.logger.warn(`Remote feed fetch failed for URL ${currentUrl}: ${errorMsg}`);

      if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        throw new GatewayTimeoutException('Timeout connecting to feed server (exceeded 60s)');
      }

      throw new BadGatewayException(`Failed to connect to feed server: ${errorMsg}`);
    }
  }

  /**
   * SSRF Protection: blocks private/loopback/cloud-metadata networks via regex and DNS pre-lookup
   */
  private async validateUrlSafety(targetUrl: string): Promise<void> {
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

    // 1. Static Hostname string checks
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

    // Private IPv4 literal hostnames
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      throw new BadRequestException('Requests to private network addresses are prohibited');
    }

    // 2. DNS Pre-Lookup: resolve actual IP address to defeat DNS rebinding (e.g. *.nip.io)
    try {
      const addresses = await dns.promises.lookup(hostname, { all: true });
      for (const entry of addresses) {
        if (this.isForbiddenIp(entry.address)) {
          throw new BadRequestException(
            'Target hostname resolves to a prohibited private, loopback, or metadata address',
          );
        }
      }
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.warn(`SSRF DNS lookup failed for hostname ${hostname}: ${err}`);
      throw new BadRequestException(`Cannot resolve hostname "${hostname}"`);
    }
  }

  private isForbiddenIp(ip: string): boolean {
    const cleanIp = ip.toLowerCase().replace(/^::ffff:/, ''); // normalize IPv4-mapped IPv6

    if (
      cleanIp === '127.0.0.1' ||
      cleanIp === '0.0.0.0' ||
      cleanIp === '::1' ||
      cleanIp.startsWith('127.')
    ) {
      return true;
    }
    if (cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) {
      return true;
    }
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp)) {
      return true;
    }
    if (cleanIp.startsWith('169.254.')) {
      return true;
    }
    if (cleanIp.startsWith('fc00:') || cleanIp.startsWith('fd') || cleanIp.startsWith('fe80:')) {
      return true;
    }
    return false;
  }
}
