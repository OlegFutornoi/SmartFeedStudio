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
import { validateUrlSafety } from '@/modules/feeds/utils/ssrf-validator';
import { Agent } from 'undici';

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
        const validated = await validateUrlSafety(currentUrl);

        // Pin IP at TCP socket level for both http: and https: to eliminate DNS Rebinding TOCTOU (SEC-05)
        const dispatcher = new Agent({
          connect: {
            lookup: (_hostname, _options, callback) => {
              callback(null, [{ address: validated.resolvedAddress, family: validated.family }]);
            },
          },
        });

        this.logger.log(
          `Fetching remote feed from URL: ${currentUrl} (pinned IP: ${validated.resolvedAddress})`,
        );

        const response = await fetch(currentUrl, {
          // @ts-expect-error Node.js global fetch supports undici custom dispatcher
          dispatcher,
          headers: {
            Host: validated.parsedUrl.host,
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
          currentUrl = new URL(location, currentUrl).toString();
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

        // BE-09: Bounded stream reader prevents OOM crashes on chunked transfer responses
        let text = '';
        let totalBytes = 0;

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                totalBytes += value.length;
                if (totalBytes > MAX_FEED_SIZE_BYTES) {
                  await reader.cancel();
                  throw new BadRequestException(
                    'Remote feed exceeds maximum supported size (50MB)',
                  );
                }
                text += decoder.decode(value, { stream: true });
              }
            }
            text += decoder.decode();
          } catch (streamErr: unknown) {
            if (streamErr instanceof BadRequestException) {
              throw streamErr;
            }
            this.logger.warn(`Stream reading interrupted for URL ${currentUrl}:`, streamErr);
            throw new BadGatewayException('Failed to read feed stream from remote server');
          }
        } else {
          text = await response.text();
        }

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
}
