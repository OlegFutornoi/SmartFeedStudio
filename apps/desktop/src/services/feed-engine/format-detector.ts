import { FeedFormat } from '@smartfeed/shared';

export interface FormatDetectionResult {
  format: FeedFormat;
  delimiter?: string;
  isXml: boolean;
}

/**
 * Fast format and delimiter detector for feed contents.
 */
export function detectFeedFormat(content: string): FormatDetectionResult {
  const trimmed = content.trim();
  const sample = trimmed.slice(0, 4096).toLowerCase();

  // XML / YML Check
  const hasXmlPreamble =
    trimmed.startsWith('<?xml') ||
    trimmed.startsWith('<yml_catalog') ||
    trimmed.startsWith('<rss') ||
    trimmed.startsWith('<feed');
  const hasFeedTags =
    sample.includes('<yml_catalog') ||
    sample.includes('<rss') ||
    sample.includes('<shop') ||
    sample.includes('<offers') ||
    sample.includes('<offer') ||
    sample.includes('<items') ||
    sample.includes('<item') ||
    sample.includes('<products') ||
    sample.includes('<entry') ||
    sample.includes('xmlns:g');

  if ((trimmed.startsWith('<') && hasFeedTags) || hasXmlPreamble) {
    if (
      sample.includes('<yml_catalog') ||
      sample.includes('prom.ua') ||
      sample.includes('prom.ua/')
    ) {
      return { format: FeedFormat.YML_PROM, isXml: true };
    }
    if (
      sample.includes('<rozetka') ||
      sample.includes('rozetka.com.ua') ||
      (sample.includes('<offers') && sample.includes('<offer'))
    ) {
      return { format: FeedFormat.XML_ROZETKA, isXml: true };
    }
    if (sample.includes('xmlns:g') || sample.includes('<g:id') || sample.includes('<g:title')) {
      return { format: FeedFormat.XML_GOOGLE, isXml: true };
    }
    return { format: FeedFormat.XML_GENERIC, isXml: true };
  }

  // CSV / TSV Delimiter Detection
  const firstLines = trimmed.split(/\r?\n/).slice(0, 5).filter(Boolean);
  if (firstLines.length > 0) {
    const delimiters = [';', ',', '\t', '|'];
    let bestDelimiter = ';';
    let maxCount = 0;

    for (const d of delimiters) {
      const counts = firstLines.map((line) => line.split(d).length - 1);
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      if (avg > maxCount) {
        maxCount = avg;
        bestDelimiter = d;
      }
    }

    if (maxCount >= 1 && firstLines[0].split(bestDelimiter).length >= 2) {
      return { format: FeedFormat.CSV, delimiter: bestDelimiter, isXml: false };
    }
  }

  throw new Error(
    'INVALID_FEED_FORMAT: Файл або посилання не містить валідної структури XML або CSV каталогу товарів',
  );
}
