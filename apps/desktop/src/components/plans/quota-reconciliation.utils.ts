/**
 * Helper to clean and format feed names and URLs for the reconciliation dialog
 */
export function formatFeedDisplay(name: string, sourceUrl?: string, s3FileKey?: string) {
  let title = name;
  let subtitle = sourceUrl || s3FileKey || '';

  if (name.startsWith('http://') || name.startsWith('https://')) {
    try {
      const url = new URL(name);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const fileName = pathParts[pathParts.length - 1];
      title = fileName || url.hostname;
      subtitle = `${url.hostname}${url.pathname}`;
    } catch {
      title = name.length > 35 ? `${name.slice(0, 32)}...` : name;
    }
  }

  // If subtitle equals title, don't duplicate it
  const showSubtitle = Boolean(subtitle && subtitle !== title);

  return { title, subtitle, showSubtitle };
}
