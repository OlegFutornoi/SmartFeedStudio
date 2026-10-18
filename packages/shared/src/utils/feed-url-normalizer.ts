import { sha256 } from './sha256';

/**
 * Marketing / tracking parameters that do not alter catalog contents.
 */
const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  '_ga',
  '_gl',
  'msclkid',
  'mc_eid',
  'dclid',
  'ref',
  'referrer',
  'affiliate_id',
  'timestamp',
  '_t',
]);

/**
 * Normalizes a raw feed URL into canonical RFC 3986 form, computes SHA-256 fingerprint, and base URL.
 */
export function normalizeFeedUrl(rawUrl: string): {
  canonicalUrl: string;
  urlFingerprint: string;
  baseFeedUrl: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { canonicalUrl: '', urlFingerprint: '', baseFeedUrl: '' };
  }

  let trimmed = rawUrl.trim();
  if (!trimmed) {
    return { canonicalUrl: '', urlFingerprint: '', baseFeedUrl: '' };
  }

  // Prepend protocol if absent
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);

    // Normalize protocol and hostname (canonicalize http -> https for public domains)
    const rawProtocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const protocol =
      rawProtocol === 'http:' && hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? 'https:'
        : rawProtocol;

    // Normalize port
    let port = parsed.port;
    if (port === '80' || port === '443') {
      port = '';
    }
    const hostWithPort = port ? `${hostname}:${port}` : hostname;

    // Normalize path: collapse duplicate slashes and remove trailing slash
    let pathname = parsed.pathname.replace(/\/+/g, '/');
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const baseFeedUrl = `${protocol}//${hostWithPort}${pathname}`;

    // Filter and sort query parameters
    const searchParams = new URLSearchParams(parsed.search);
    const validParams: [string, string][] = [];

    searchParams.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!TRACKING_QUERY_PARAMS.has(lowerKey)) {
        validParams.push([key, value]);
      }
    });

    validParams.sort(([a], [b]) => a.localeCompare(b));

    const sortedSearch =
      validParams.length > 0
        ? `?${validParams.map(([k, v]) => (v ? `${k}=${v}` : k)).join('&')}`
        : '';

    const canonicalUrl = `${protocol}//${hostWithPort}${pathname}${sortedSearch}`;
    const urlFingerprint = sha256(canonicalUrl);

    return {
      canonicalUrl,
      urlFingerprint,
      baseFeedUrl,
    };
  } catch {
    // If URL cannot be parsed by standard URL API, fall back to basic string normalization
    const sanitized = trimmed
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, '')
      .replace(/\/+$/, '');
    const withoutQuery = sanitized.split('?')[0];
    return {
      canonicalUrl: sanitized,
      urlFingerprint: sha256(sanitized),
      baseFeedUrl: withoutQuery,
    };
  }
}

/**
 * Extracts base URL (protocol, hostname, pathname without search params) for feed duplicate detection.
 */
export function extractBaseFeedUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  const normalized = normalizeFeedUrl(trimmed);
  return normalized.baseFeedUrl;
}

/**
 * Checks whether two feed URLs are equivalent (same fingerprint, same canonical URL, or same base host/path).
 */
export function areFeedUrlsEquivalent(url1?: string | null, url2?: string | null): boolean {
  if (!url1 || !url2) return false;
  const clean1 = url1.trim();
  const clean2 = url2.trim();
  if (!clean1 || !clean2) return false;
  if (clean1.toLowerCase() === clean2.toLowerCase()) return true;

  const norm1 = normalizeFeedUrl(clean1);
  const norm2 = normalizeFeedUrl(clean2);

  if (norm1.urlFingerprint && norm1.urlFingerprint === norm2.urlFingerprint) return true;
  if (norm1.canonicalUrl && norm1.canonicalUrl === norm2.canonicalUrl) return true;
  if (norm1.baseFeedUrl && norm2.baseFeedUrl && norm1.baseFeedUrl === norm2.baseFeedUrl)
    return true;

  return false;
}

/**
 * Computes deterministic content hash of raw feed file/string (first 64KB or entire string).
 */
export function computeFeedContentHash(content: string): string {
  if (!content) return '';
  const sample = content.length > 65536 ? content.slice(0, 65536) : content;
  return sha256(sample);
}

/**
 * Generates an auto-disambiguated unique feed name if a name collision occurs.
 */
export function generateDisambiguatedFeedName(
  candidateName: string,
  existingNames: string[],
  supplierName?: string,
): string {
  const baseName = candidateName?.trim() || 'Фід товарів';
  const existingSet = new Set(existingNames.map((n) => n.trim().toLowerCase()));

  if (!existingSet.has(baseName.toLowerCase())) {
    return baseName;
  }

  // Strategy 1: Append supplier name if available and not already part of candidate
  if (supplierName && !baseName.toLowerCase().includes(supplierName.toLowerCase())) {
    const withSupplier = `${baseName} [${supplierName.trim()}]`;
    if (!existingSet.has(withSupplier.toLowerCase())) {
      return withSupplier;
    }
  }

  // Strategy 2: Numeric suffix disambiguation
  let counter = 2;
  while (counter < 100) {
    const numbered = `${baseName} #${counter}`;
    if (!existingSet.has(numbered.toLowerCase())) {
      return numbered;
    }
    counter++;
  }

  return `${baseName} (${Date.now().toString(36)})`;
}
