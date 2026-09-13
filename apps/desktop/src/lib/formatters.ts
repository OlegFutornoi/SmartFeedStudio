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
 * Formats a feed name for UI display.
 * If the name itself is an HTTP URL (or no name is provided), it extracts
 * a human-friendly label like "livolo.in.ua (rozetka.xml)" or "livolo.in.ua".
 */
export function formatFeedTitle(name?: string | null, sourceUrl?: string | null): string {
  const candidate = name || sourceUrl;
  if (!candidate) return '';

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    try {
      const parsed = new URL(candidate);
      const host = parsed.hostname.replace(/^www\./, '');
      const parts = parsed.pathname.split('/').filter(Boolean);
      const fileName = parts[parts.length - 1];

      if (
        fileName &&
        (fileName.endsWith('.xml') ||
          fileName.endsWith('.csv') ||
          fileName.endsWith('.json') ||
          fileName.endsWith('.yml'))
      ) {
        return `${host} (${fileName})`;
      }
      return host || formatDisplayUrl(candidate);
    } catch (err) {
      console.warn('[formatters:formatFeedTitle] Failed to parse URL:', err);
      return candidate.length > 35 ? `${candidate.slice(0, 32)}...` : candidate;
    }
  }

  return candidate;
}
