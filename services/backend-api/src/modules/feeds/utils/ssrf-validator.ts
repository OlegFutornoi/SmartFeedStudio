import * as dns from 'dns';
import * as net from 'net';
import { BadRequestException, Logger } from '@nestjs/common';

const logger = new Logger('SsrfValidator');

export interface ValidatedFeedTarget {
  parsedUrl: URL;
  resolvedAddress: string;
  family: number;
}

/**
 * Checks whether an IPv4 or IPv6 address belongs to a private, loopback,
 * link-local, cloud-metadata, or multicast range (SEC-05).
 */
export function isForbiddenIp(ip: string): boolean {
  const cleanIp = ip.toLowerCase().replace(/^::ffff:/, '');

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
  if (cleanIp.startsWith('169.254.') || cleanIp.startsWith('100.64.')) {
    return true;
  }
  if (
    cleanIp.startsWith('192.0.2.') ||
    cleanIp.startsWith('198.51.100.') ||
    cleanIp.startsWith('203.0.113.') ||
    cleanIp.startsWith('224.')
  ) {
    return true;
  }
  if (cleanIp.startsWith('fc00:') || cleanIp.startsWith('fd') || cleanIp.startsWith('fe80:')) {
    return true;
  }
  return false;
}

/**
 * Validates target URL protocol, hostname, and resolves DNS once to prevent
 * SSRF and DNS Rebinding (TOCTOU) attacks. Returns the pinned IP address.
 */
export async function validateUrlSafety(targetUrl: string): Promise<ValidatedFeedTarget> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    logger.warn(`[SsrfValidator] Invalid URL format encountered: ${targetUrl}`, err);
    throw new BadRequestException('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestException('Only HTTP and HTTPS protocols are permitted');
  }

  const hostname = parsed.hostname.toLowerCase();

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

  if (hostname === '169.254.169.254' || hostname.startsWith('169.254.')) {
    throw new BadRequestException('Requests to link-local addresses are prohibited');
  }

  if (
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    throw new BadRequestException('Requests to private network addresses are prohibited');
  }

  if (net.isIP(hostname)) {
    if (isForbiddenIp(hostname)) {
      throw new BadRequestException(
        'Target hostname resolves to a prohibited private, loopback, or metadata address',
      );
    }
    return {
      parsedUrl: parsed,
      resolvedAddress: hostname,
      family: net.isIPv6(hostname) ? 6 : 4,
    };
  }

  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error('No DNS records returned');
    }
    for (const entry of addresses) {
      if (isForbiddenIp(entry.address)) {
        throw new BadRequestException(
          'Target hostname resolves to a prohibited private, loopback, or metadata address',
        );
      }
    }
    return {
      parsedUrl: parsed,
      resolvedAddress: addresses[0].address,
      family: addresses[0].family,
    };
  } catch (err: unknown) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    logger.warn(`SSRF DNS lookup failed for hostname ${hostname}: ${err}`);
    throw new BadRequestException(`Cannot resolve hostname "${hostname}"`);
  }
}
