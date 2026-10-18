import type { CreateMarketplaceCategoryDto } from '@smartfeed/shared';

export function parseCategoryFileContent(
  fileName: string,
  content: string,
  marketplaceCode: string,
  xmlAttributeName: string,
): CreateMarketplaceCategoryDto[] {
  if (fileName.endsWith('.json')) {
    const raw = JSON.parse(content);
    const list = Array.isArray(raw) ? raw : [raw];
    const mapped: CreateMarketplaceCategoryDto[] = list
      .filter((item) => item.externalId && item.nameUk)
      .map((item) => ({
        marketplaceCode: item.marketplaceCode || marketplaceCode,
        externalId: String(item.externalId),
        xmlAttributeName: item.xmlAttributeName || xmlAttributeName,
        nameUk: item.nameUk || item.name,
        nameEn: item.nameEn || null,
        fullPathUk: item.fullPathUk || item.path || null,
        defaultCommissionPercent: Number(item.defaultCommissionPercent ?? item.commission ?? 0),
        url: item.url || null,
      }));
    if (mapped.length === 0) {
      throw new Error(
        'У JSON файлі не знайдено валідних категорій (потрібні externalId та nameUk)',
      );
    }
    return mapped;
  }

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error('Файл не містить рядків даних');
  }

  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const headerRow = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

  const idIdx = headerRow.findIndex(
    (h) => h === 'id' || h === 'код' || h === 'externalid' || h === 'category_id',
  );
  const nameIdx = headerRow.findIndex(
    (h) => h === 'name' || h === 'назва' || h === 'nameuk' || h === 'category_name',
  );
  const commIdx = headerRow.findIndex(
    (h) =>
      h.includes('com') ||
      h.includes('ком') ||
      h.includes('fee') ||
      h.includes('tax') ||
      h.includes('відсоток'),
  );
  const pathIdx = headerRow.findIndex(
    (h) => h === 'path' || h === 'шлях' || h === 'fullpath' || h === 'fullpathuk',
  );

  const resolvedIdIdx = idIdx >= 0 ? idIdx : 0;
  const resolvedNameIdx = nameIdx >= 0 ? nameIdx : 1;
  const resolvedCommIdx = commIdx >= 0 ? commIdx : 2;
  const resolvedPathIdx = pathIdx >= 0 ? pathIdx : 3;

  const items: CreateMarketplaceCategoryDto[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map((p) => p.trim());
    const rawId = parts[resolvedIdIdx]?.replace(/^["']|["']$/g, '');
    const rawName = parts[resolvedNameIdx]?.replace(/^["']|["']$/g, '');
    if (!rawId || !rawName) continue;

    const commNum = parts[resolvedCommIdx]
      ? parseFloat(parts[resolvedCommIdx].replace(',', '.'))
      : 0;
    const fullPath = parts[resolvedPathIdx]?.replace(/^["']|["']$/g, '') || undefined;

    items.push({
      marketplaceCode,
      externalId: rawId,
      xmlAttributeName,
      nameUk: rawName,
      defaultCommissionPercent: isNaN(commNum) ? 0 : commNum,
      fullPathUk: fullPath,
    });
  }

  if (items.length === 0) {
    throw new Error(
      'Не вдалося розпізнати категорії. Перевірте формат колонок (id;name;commission)',
    );
  }

  return items;
}
