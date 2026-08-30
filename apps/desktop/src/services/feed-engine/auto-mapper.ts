import type { FeedColumnMapping } from '@smartfeed/shared';

const FIELD_SYNONYMS: Record<string, string[]> = {
  sku: [
    'sku',
    'vendorcode',
    'артикул',
    'код',
    'код_товара',
    'id',
    'offer_id',
    'g:id',
    'g:mpn',
    'код товара',
    'арт',
    'article',
  ],
  titleUk: [
    'title',
    'name',
    'назва',
    'найменування',
    'товар',
    'название',
    'name_ua',
    'name_uk',
    'g:title',
    'title_ua',
    'заголовок',
  ],
  price: [
    'price',
    'ціна',
    'цена',
    'роздріб',
    'retail_price',
    'g:price',
    'ціна роздрібна',
    'price_uah',
    'розница',
    'ціна грн',
  ],
  costPrice: [
    'costprice',
    'price_cost',
    'cost',
    'закупівля',
    'опт',
    'закупка',
    'цена опт',
    'wholesale_price',
    'g:cost_of_goods_sold',
    'вхідна ціна',
    'оптовая цена',
  ],
  stockQuantity: [
    'quantity',
    'stock',
    'кількість',
    'залишок',
    'остаток',
    'qty',
    'g:quantity',
    'count',
    'наличие_кол',
    'залишки',
  ],
  inStock: ['instock', 'available', 'наявність', 'наличие', 'статус', 'g:availability', 'status'],
  categoryId: ['categoryid', 'category_id', 'код_категорії', 'код_категории', 'id_категории'],
  categoryName: [
    'category',
    'категорія',
    'категория',
    'розділ',
    'раздел',
    'group',
    'g:product_type',
    'категорія товару',
    'назва категорії',
  ],
  vendor: [
    'vendor',
    'brand',
    'бренд',
    'виробник',
    'производитель',
    'g:brand',
    'марка',
    'торгова марка',
  ],
  barcode: ['barcode', 'ean', 'gtin', 'upc', 'штрихкод', 'штрих-код'],
  descriptionUk: [
    'description',
    'опис',
    'описание',
    'характеристики',
    'g:description',
    'description_ua',
    'полное описание',
    'детальний опис',
  ],
  imageUrl: [
    'picture',
    'image',
    'photo',
    'фото',
    'зображення',
    'g:image_link',
    'картинка',
    'image_url',
    'фотографія',
  ],
};

/**
 * Heuristic auto-mapping for column headers.
 */
export function autoMapColumns(headers: string[]): FeedColumnMapping[] {
  const mappings: FeedColumnMapping[] = [];
  const usedTargets = new Set<string>();

  for (const rawHeader of headers) {
    const cleanHeader = rawHeader
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/g, '');
    let matchedTarget: string | null = null;
    let maxConfidence = 0;

    for (const [targetField, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (usedTargets.has(targetField)) continue;

      for (const syn of synonyms) {
        const cleanSyn = syn.toLowerCase().replace(/[\s_-]+/g, '');
        if (cleanHeader === cleanSyn) {
          matchedTarget = targetField;
          maxConfidence = 100;
          break;
        }
        if (cleanHeader.includes(cleanSyn) || cleanSyn.includes(cleanHeader)) {
          if (maxConfidence < 75) {
            matchedTarget = targetField;
            maxConfidence = 75;
          }
        }
      }

      if (maxConfidence === 100) break;
    }

    if (matchedTarget) {
      usedTargets.add(matchedTarget);
      mappings.push({
        targetField: matchedTarget,
        sourceField: rawHeader,
        confidence: maxConfidence,
      });
    }
  }

  return mappings;
}
