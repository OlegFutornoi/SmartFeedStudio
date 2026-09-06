import { formatFeedTitle, formatDisplayUrl } from '@/lib/formatters';

/**
 * Helper to clean and format feed names and URLs for the reconciliation dialog
 */
export function formatFeedDisplay(name: string, sourceUrl?: string, s3FileKey?: string) {
  const title = formatFeedTitle(name, sourceUrl);
  const subtitle = sourceUrl ? formatDisplayUrl(sourceUrl) : s3FileKey || '';

  // If subtitle equals title, don't duplicate it
  const showSubtitle = Boolean(subtitle && subtitle !== title);

  return { title, subtitle, showSubtitle };
}
