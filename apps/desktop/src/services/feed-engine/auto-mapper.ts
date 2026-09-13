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
    'name_ua',
    'name_uk',
    'title_ua',
    'title_uk',
    'назва (ua)',
    'назва(ua)',
    'название товара (ua)',
    'назва товару (ua)',
    'назва товару',
    'назва',
    'найменування',
    'title',
    'name',
    'товар',
    'название товара',
    'название',
    'g:title',
    'заголовок',
  ],
  price: [
    'рекомендовання розничная цена',
    'рекомендована роздрібна ціна',
    'рекомендована ціна',
    'рекомендованная цена',
    'ррц',
    'retail_price',
    'роздрібна ціна',
    'ціна роздрібна',
    'розница',
    'price_uah',
    'ціна грн',
    'price',
    'ціна',
    'цена',
  ],
  costPrice: [
    'дроп цена для партнера',
    'дроп ціна для партнера',
    'дроп цена',
    'дроп ціна',
    'дроп',
    'партнерська ціна',
    'партнерская цена',
    'costprice',
    'price_cost',
    'cost',
    'закупівля',
    'закупка',
    'опт',
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
    'залишки',
    'наличие_кол',
  ],
  inStock: ['instock', 'available', 'наявність', 'наличие', 'статус', 'g:availability', 'status'],
  categoryId: ['categoryid', 'category_id', 'код_категорії', 'код_категории', 'id_категории'],
  categoryName: [
    'категория товаров (ua)',
    'категорія товарів (ua)',
    'категорія товару (ua)',
    'категорія (ua)',
    'категорія товару',
    'категорії товару',
    'категории товара',
    'категорія',
    'категория',
    'розділ',
    'раздел',
    'group',
    'g:product_type',
    'category',
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
    'description_ua',
    'description_uk',
    'опис (ua)',
    'опис(ua)',
    'опис товару (ua)',
    'описание товара (ua)',
    'детальний опис',
    'повний опис',
    'description',
    'опис',
    'описание',
    'характеристики',
    'g:description',
  ],
  imageUrl: [
    'изображения',
    'зображення',
    'изображение',
    'картинки',
    'фотографії',
    'ссылки на фото',
    'picture',
    'image',
    'photo',
    'фото',
    'g:image_link',
    'картинка',
    'image_url',
    'фотографія',
  ],
};

interface CandidateMatch {
  targetField: string;
  sourceField: string;
  score: number;
  confidence: number;
}

/**
 * Heuristic auto-mapping for column headers with Ukrainian priority
 * and globally optimal assignment.
 */
export function autoMapColumns(headers: string[]): FeedColumnMapping[] {
  const candidates: CandidateMatch[] = [];

  for (const rawHeader of headers) {
    const cleanHeader = rawHeader
      .toLowerCase()
      .trim()
      .replace(/[\s_\-()]+/g, '');

    for (const [targetField, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      for (let idx = 0; idx < synonyms.length; idx++) {
        const syn = synonyms[idx];
        const cleanSyn = syn.toLowerCase().replace(/[\s_\-()]+/g, '');

        if (cleanHeader === cleanSyn) {
          // Exact match (prioritized by synonym order)
          candidates.push({
            targetField,
            sourceField: rawHeader,
            score: 100 - idx * 0.1,
            confidence: 100,
          });
          break;
        } else if (cleanHeader.includes(cleanSyn) || cleanSyn.includes(cleanHeader)) {
          // Substring match
          candidates.push({
            targetField,
            sourceField: rawHeader,
            score: 70 - idx * 0.2,
            confidence: 75,
          });
        }
      }
    }
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const mappings: FeedColumnMapping[] = [];
  const assignedTargets = new Set<string>();
  const assignedHeaders = new Set<string>();

  for (const cand of candidates) {
    if (assignedTargets.has(cand.targetField) || assignedHeaders.has(cand.sourceField)) {
      continue;
    }
    assignedTargets.add(cand.targetField);
    assignedHeaders.add(cand.sourceField);
    mappings.push({
      targetField: cand.targetField,
      sourceField: cand.sourceField,
      confidence: cand.confidence,
    });
  }

  return mappings;
}
