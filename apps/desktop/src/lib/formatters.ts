/**
 * Utility functions for user-friendly text, URL, and feed name formatting.
 * Prevents exposing raw URLs with auth tokens or lengthy parameter strings.
 */

/**
 * Strips protocol, 'www.', query parameters, and hashes from a URL for clean display.
 * E.g., "https://livolo.in.ua/feed/rozetka.xml?token=abc12345&lang=ua" -> "livolo.in.ua/feed/rozetka.xml"
 */
export function formatDisplayUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${host}${pathname}`;
  } catch (err) {
    console.warn('[formatters:formatDisplayUrl] Failed to parse URL:', err);
    return url.length > 40 ? `${url.slice(0, 37)}...` : url;
  }
}

/**
 * Returns just the hostname without 'www.'
 * E.g., "https://livolo.in.ua/feed/rozetka.xml?token=abc12345" -> "livolo.in.ua"
 */
export function formatHostname(url?: string | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (err) {
    console.warn('[formatters:formatHostname] Failed to parse URL:', err);
    return url.slice(0, 30);
  }
}

/**
 * Common generic feed file stems that add zero distinguishing information to human users.
 * E.g., "products_feed.xml", "catalog.xml", "price.csv" should resolve to just the host domain.
 */
const GENERIC_FEED_STEMS = new Set([
  'products_feed',
  'product_feed',
  'products',
  'product',
  'feed',
  'feeds',
  'catalog',
  'catalogs',
  'price',
  'prices',
  'pricelist',
  'price_list',
  'export',
  'export_feed',
  'export_products',
  'export_all',
  'all',
  'allcategories',
  'all_categories',
  'data',
  'goods',
  'items',
  'xml',
  'csv',
  'yml',
  'yaml',
  'rss',
  'prom',
  'prom_ua',
  'rozetka',
  'yandex',
  'google',
  'google_merchant',
  'index',
  'main',
  'shop',
  'store',
  'output',
  'catalog_products',
]);

const FEED_EXTENSIONS_REGEX = /\.(xml|csv|json|yml|yaml|tsv|xlsx|xls|txt)$/i;

function isGenericStem(stem: string): boolean {
  const normalized = stem.toLowerCase().trim();
  if (GENERIC_FEED_STEMS.has(normalized)) return true;
  const base = normalized.replace(/[-_0-9]+$/, '');
  return GENERIC_FEED_STEMS.has(base);
}

function cleanFeedParentheses(str: string): string {
  const match = str.match(/^([^()]+?)\s*\(([^()]+)\)$/);
  if (!match) return str;
  const hostPart = match[1].trim();
  const inner = match[2].trim();
  const innerWithoutExt = inner.replace(FEED_EXTENSIONS_REGEX, '');
  if (isGenericStem(innerWithoutExt)) {
    return hostPart;
  }
  return `${hostPart} (${innerWithoutExt})`;
}

/**
 * Formats a feed name for UI display.
 * Generates a clean, short, human-friendly title:
 * - Omits generic boilerplate filenames like `products_feed.xml`, `catalog.xml` -> returns clean domain (e.g. "livolo.kiev.ua").
 * - Strips file extensions like `.xml`, `.csv` from specific sub-feeds (e.g. "supplier.ua (lighting)").
 * - Cleans legacy formatted strings like "livolo.kiev.ua (products_feed.xml)" -> "livolo.kiev.ua".
 */
export function formatFeedTitle(name?: string | null, sourceUrl?: string | null): string {
  let candidate = (name || sourceUrl || '').trim();
  if (!candidate) return '';

  candidate = cleanFeedParentheses(candidate);

  const isUrl =
    candidate.startsWith('http://') ||
    candidate.startsWith('https://') ||
    (!candidate.includes(' ') &&
      (candidate.includes('.xml') ||
        candidate.includes('.csv') ||
        candidate.includes('.yml') ||
        candidate.includes('.json')) &&
      candidate.includes('/'));

  if (isUrl) {
    try {
      const urlToParse =
        candidate.startsWith('http://') || candidate.startsWith('https://')
          ? candidate
          : `https://${candidate}`;
      const parsed = new URL(urlToParse);
      const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
      const parts = parsed.pathname.split('/').filter(Boolean);
      const lastPart = parts[parts.length - 1] || '';
      const stem = lastPart.replace(FEED_EXTENSIONS_REGEX, '').trim();

      if (!stem || isGenericStem(stem)) {
        return host || formatDisplayUrl(candidate);
      }

      const cleanStem = stem.length > 20 ? `${stem.slice(0, 18)}...` : stem;
      return `${host} (${cleanStem})`;
    } catch (err) {
      console.warn('[formatters:formatFeedTitle] Failed to parse URL:', err);
      return candidate.length > 35 ? `${candidate.slice(0, 32)}...` : candidate;
    }
  }

  if (FEED_EXTENSIONS_REGEX.test(candidate)) {
    const stem = candidate.replace(FEED_EXTENSIONS_REGEX, '').trim();
    if (isGenericStem(stem)) {
      return 'Каталог товарів';
    }
    return stem;
  }

  return candidate;
}

/**
 * Formats byte sizes into human readable strings (e.g. 1.2 MB, 450 KB).
 */
export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Generates an ultra-short, deterministic feed title based on the supplier name.
 * Format:
 * - 1st feed: `${supplierName}` (e.g. "Mobioptom")
 * - 2nd feed: `${supplierName}_2` (e.g. "Mobioptom_2")
 * - 3rd feed: `${supplierName}_3` (e.g. "Mobioptom_3")
 *
 * If existing feed names or count are provided, finds the next available index:
 * If "Mobioptom" is not taken -> "Mobioptom"
 * If "Mobioptom" is taken -> tests "Mobioptom_2", "Mobioptom_3", etc.
 */
export function generateSupplierFeedTitle(
  supplierName?: string | null,
  existingFeedsOrCount?: number | string[] | { name?: string | null }[] | null,
): string {
  const baseName = (supplierName || '').trim() || 'Каталог';

  if (typeof existingFeedsOrCount === 'number') {
    if (existingFeedsOrCount <= 0) return baseName;
    return `${baseName}_${existingFeedsOrCount + 1}`;
  }

  if (Array.isArray(existingFeedsOrCount)) {
    const existingNames = new Set(
      existingFeedsOrCount
        .map((item) => (typeof item === 'string' ? item : item?.name || ''))
        .filter(Boolean)
        .map((n) => n.trim().toLowerCase()),
    );

    if (!existingNames.has(baseName.toLowerCase())) {
      return baseName;
    }

    let index = 2;
    while (existingNames.has(`${baseName}_${index}`.toLowerCase())) {
      index++;
    }
    return `${baseName}_${index}`;
  }

  return baseName;
}

/**
 * Checks if a given feed name was auto-generated (or is legacy/empty)
 * so it can be safely updated when a supplier, file, or URL changes.
 */
export function isAutoGeneratedFeedName(
  name?: string | null,
  supplierName?: string | null,
): boolean {
  if (!name || !name.trim()) return true;
  const trimmed = name.trim();

  // Raw file names with extensions like ExportWebskladCSV.csv
  if (FEED_EXTENSIONS_REGEX.test(trimmed)) {
    return true;
  }

  // Generic fallback names
  if (/^(каталог|прайс|фід)(_\d+)?$/i.test(trimmed) || trimmed === 'Каталог товарів') {
    return true;
  }

  // Matches supplier pattern: Supplier, Supplier_2, Supplier_3, etc.
  if (supplierName && supplierName.trim()) {
    const escaped = supplierName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}(_\\d+)?$`, 'i');
    if (regex.test(trimmed)) return true;
  }

  return false;
}
