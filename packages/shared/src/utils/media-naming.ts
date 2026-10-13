/**
 * Transliteration map covering Ukrainian, standard Cyrillic, and Eastern European letters.
 */
const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  // Ukrainian & Cyrillic lowercase
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya',
  ы: 'y',
  э: 'e',
  ё: 'yo',
  ъ: '',
  // Uppercase
  А: 'A',
  Б: 'B',
  В: 'V',
  Г: 'H',
  Ґ: 'G',
  Д: 'D',
  Е: 'E',
  Є: 'Ye',
  Ж: 'Zh',
  З: 'Z',
  И: 'Y',
  І: 'I',
  Ї: 'Yi',
  Й: 'Y',
  К: 'K',
  Л: 'L',
  М: 'M',
  Н: 'N',
  О: 'O',
  П: 'P',
  Р: 'R',
  С: 'S',
  Т: 'T',
  У: 'U',
  Ф: 'F',
  Х: 'Kh',
  Ц: 'Ts',
  Ч: 'Ch',
  Ш: 'Sh',
  Щ: 'Shch',
  Ь: '',
  Ю: 'Yu',
  Я: 'Ya',
  Ы: 'Y',
  Э: 'E',
  Ё: 'Yo',
  Ъ: '',
};

/**
 * Transliterates Cyrillic text to Latin characters.
 */
export function transliterateCyrillicToLatin(text: string): string {
  if (!text) return '';
  return text
    .split('')
    .map((char) => (char in CYRILLIC_TO_LATIN_MAP ? CYRILLIC_TO_LATIN_MAP[char] : char))
    .join('');
}

/**
 * Converts any text (supplier name, SKU, product title) into a URL/file-safe Latin slug.
 */
export function slugifyFileName(text: string, fallback = 'item'): string {
  if (!text) return fallback;

  const latinized = transliterateCyrillicToLatin(text);

  const slug = latinized
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

export interface FormatProductImageFileNameOptions {
  supplier?: string | null;
  sku?: string | null;
  index?: number;
  isMain?: boolean;
  extension?: string;
}

/**
 * Generates a clean, professional, human-readable file name for product photos.
 * Example: `websklad_art-10492-chornyi_01.webp` or `brain_ws-9812_02.webp`
 */
export function formatProductImageFileName(options: FormatProductImageFileNameOptions): string {
  const { supplier, sku, index = 0, extension = 'webp' } = options;

  const supplierSlug = slugifyFileName(supplier || 'vendor', 'vendor');
  const skuSlug = slugifyFileName(sku || 'product', 'product');

  const paddedIndex = String(Math.max(1, index + 1)).padStart(2, '0');
  const cleanExt = extension.replace(/^\./, '').toLowerCase() || 'webp';

  return `${supplierSlug}_${skuSlug}_${paddedIndex}.${cleanExt}`;
}
