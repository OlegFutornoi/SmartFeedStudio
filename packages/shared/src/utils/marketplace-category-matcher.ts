import type { MarketplaceCategoryDto } from '../dtos/supplier-category.dto.js';

export interface ParsedMarketplaceCategoryRef {
  marketplaceCode: string;
  externalId: string;
  xmlAttributeName: string;
  extractedUrl?: string;
}

/**
 * Extracts marketplace category ID (e.g. Rozetka `rz_id` after `/c<digits>/`) from a URL or raw ID string.
 * Example: "https://rozetka.com.ua/ua/zaryadnie-stantsii-4674585/c4674585/" -> { marketplaceCode: 'ROZETKA', externalId: '4674585', xmlAttributeName: 'rz_id' }
 */
export function parseMarketplaceCategoryUrl(
  rawInput: string,
  defaultMarketplace = 'ROZETKA',
): ParsedMarketplaceCategoryRef | null {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return null;

  // 1. Rozetka URL pattern: rozetka.com.ua/.../c4674585/ or /c4674585
  const rozetkaUrlMatch = trimmed.match(/rozetka\.com\.ua\/.*?\/c(\d+)(?:\/|$|\?)/i);
  if (rozetkaUrlMatch?.[1]) {
    return {
      marketplaceCode: 'ROZETKA',
      externalId: rozetkaUrlMatch[1],
      xmlAttributeName: 'rz_id',
      extractedUrl: trimmed,
    };
  }

  // 2. Prom.ua URL pattern: prom.ua/...-c140209.html or /c140209
  const promUrlMatch = trimmed.match(/prom\.ua\/.*?c(\d+)/i);
  if (promUrlMatch?.[1]) {
    return {
      marketplaceCode: 'PROM',
      externalId: promUrlMatch[1],
      xmlAttributeName: 'portal_id',
      extractedUrl: trimmed,
    };
  }

  // 3. Shorthand "c4674585" or raw digits "4674585"
  const cDigitsMatch = trimmed.match(/^c?(\d{3,12})$/i);
  if (cDigitsMatch?.[1]) {
    const mp = defaultMarketplace.toUpperCase();
    const attrMap: Record<string, string> = {
      ROZETKA: 'rz_id',
      PROM: 'portal_id',
      EPICENTR: 'category_code',
      ALLO: 'allo_id',
      KASTA: 'kasta_id',
    };
    return {
      marketplaceCode: mp,
      externalId: cDigitsMatch[1],
      xmlAttributeName: attrMap[mp] || 'external_id',
    };
  }

  return null;
}

/**
 * Matches a supplier feed category name (Ukrainian, Russian, or English) to the best marketplace category
 * for the given marketplaceCode.
 */
export function suggestMarketplaceCategory(
  supplierCategoryName: string,
  catalog: MarketplaceCategoryDto[],
  marketplaceCode = 'ROZETKA',
): MarketplaceCategoryDto | null {
  const q = (supplierCategoryName || '').toLowerCase();
  if (!q) return null;

  const mpList = catalog.filter(
    (c) =>
      c.marketplaceCode.toUpperCase() === marketplaceCode.toUpperCase() && c.isActive !== false,
  );
  if (mpList.length === 0) return null;

  const findById = (extId: string) => mpList.find((c) => c.externalId === extId) || null;

  // Keyword rules for electrical switches, sockets, smart home, power stations, and electronics
  const rules: Array<{ keywords: string[]; externalIds: Record<string, string> }> = [
    {
      keywords: ['сенсорн', 'умн', 'розумн', 'smart', 'wifi', 'zigbee'],
      externalIds: { ROZETKA: '4662497', PROM: '140209', EPICENTR: '2841' },
    },
    {
      keywords: ['выключател', 'вимикач', 'перемикач', 'elios', 'livolo'],
      externalIds: { ROZETKA: '4629471', PROM: '140209', EPICENTR: '2841' },
    },
    {
      keywords: ['рамк', 'склян', 'стеклян'],
      externalIds: { ROZETKA: '4631383', PROM: '140210', EPICENTR: '2841' },
    },
    {
      keywords: ['розетк', 'socket'],
      externalIds: { ROZETKA: '4629473', PROM: '140210', EPICENTR: '2841' },
    },
    {
      keywords: ['димер', 'диммер', 'реле', 'світлорегулятор'],
      externalIds: { ROZETKA: '4638471', PROM: '140209', EPICENTR: '2841' },
    },
    {
      keywords: ['терморегулятор', 'тепл'],
      externalIds: { ROZETKA: '4671408', PROM: '140209', EPICENTR: '2841' },
    },
    {
      keywords: ['зарядн', 'станц', 'ecoflow', 'bluetti', 'anker'],
      externalIds: { ROZETKA: '4674585', PROM: '310501', EPICENTR: '2842' },
    },
    {
      keywords: ['павербанк', 'повербанк', 'powerbank', 'power bank', 'умб', 'акумулятор'],
      externalIds: { ROZETKA: '4626998', PROM: '310501', EPICENTR: '2842' },
    },
    {
      keywords: ['інвертор', 'инвертор'],
      externalIds: { ROZETKA: '4669865', PROM: '310501', EPICENTR: '2842' },
    },
    {
      keywords: ['сонячн', 'солнечн'],
      externalIds: { ROZETKA: '4626993', PROM: '310501', EPICENTR: '2842' },
    },
    {
      keywords: ['смартфон', 'телефон', 'iphone', 'xiaomi', 'samsung'],
      externalIds: { ROZETKA: '80003', PROM: '180102', EPICENTR: '2842' },
    },
    {
      keywords: ['навушник', 'наушник', 'гарнітур', 'tws', 'airpods'],
      externalIds: { ROZETKA: '80027', PROM: '180102', EPICENTR: '2842' },
    },
    {
      keywords: ['годинник', 'часы', 'watch', 'браслет'],
      externalIds: { ROZETKA: '4627814', PROM: '180102', EPICENTR: '2842' },
    },
    {
      keywords: ['кабел', 'шнур', 'перехідник', 'адаптер', 'type-c', 'lightning'],
      externalIds: { ROZETKA: '4664188', PROM: '180102', EPICENTR: '2842' },
    },
    {
      keywords: ['роутер', 'маршрутизатор', 'wi-fi'],
      externalIds: { ROZETKA: '4623561', PROM: '180102', EPICENTR: '2842' },
    },
    {
      keywords: ['ламп', 'освітлен', 'led', 'світильник'],
      externalIds: { ROZETKA: '4632128', PROM: '140209', EPICENTR: '2841' },
    },
    {
      keywords: ['датчик', 'сенсор руху'],
      externalIds: { ROZETKA: '4659438', PROM: '140209', EPICENTR: '2841' },
    },
  ];

  // Special check: if both "сенсорн" and "выключател" are present, prefer smart switches (4662497)
  if (
    (q.includes('сенсорн') || q.includes('розумн') || q.includes('умн')) &&
    (q.includes('выключател') || q.includes('вимикач'))
  ) {
    const smartMatch = findById(rules[0].externalIds[marketplaceCode.toUpperCase()] || '4662497');
    if (smartMatch) return smartMatch;
  }

  for (const rule of rules) {
    if (rule.keywords.some((kw) => q.includes(kw))) {
      const targetId = rule.externalIds[marketplaceCode.toUpperCase()];
      if (targetId) {
        const found = findById(targetId);
        if (found) return found;
      }
    }
  }

  // Fallback substring match against nameUk
  return (
    mpList.find((c) => q.includes(c.nameUk.toLowerCase()) || c.nameUk.toLowerCase().includes(q)) ||
    null
  );
}
