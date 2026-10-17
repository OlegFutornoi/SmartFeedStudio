/**
 * Standard pure TypeScript SHA-256 hash algorithm
 * Synchronous and cross-platform (Node, Browser, Tauri, Web Worker)
 */
function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0x0bef9a3f, 0xc67178f2,
  ];

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // non-ascii
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);

      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        w[i];
      const temp2 =
        (((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

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

    // Normalize protocol and hostname
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Normalize port
    let port = parsed.port;
    if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
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
