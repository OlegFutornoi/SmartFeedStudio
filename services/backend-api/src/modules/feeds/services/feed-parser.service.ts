import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { parse as parseCsv } from 'csv-parse/sync';
import { FeedFormat } from '@smartfeed/shared';

export interface ParsedProductItem {
  sku: string;
  externalId?: string;
  barcode?: string;
  vendorCode?: string;
  titleUk: string;
  titleEn?: string;
  descriptionUk?: string;
  descriptionEn?: string;
  vendor?: string;
  costPrice: number;
  price: number;
  oldPrice?: number;
  currency: string;
  stockQuantity: number;
  inStock: boolean;
  categoryId?: string;
  categoryName?: string;
  images: Array<{ originalUrl: string; order: number; isMain: boolean }>;
  attributes: Array<{
    nameUk: string;
    nameEn?: string;
    valueUk: string;
    valueEn?: string;
    unit?: string;
    order: number;
  }>;
  rawPayload?: Record<string, any>;
}

export interface ParsedCategorySummary {
  id: string;
  externalId: string;
  parentId?: string;
  name: string;
  productCount: number;
}

export interface ParsedFeedResult {
  format: FeedFormat;
  categories: ParsedCategorySummary[];
  products: ParsedProductItem[];
}

@Injectable()
export class FeedParserService {
  private xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    allowBooleanAttributes: true,
    parseTagValue: true,
    trimValues: true,
  });

  async fetchFeedFromUrl(url: string, headers: Record<string, string> = {}): Promise<string> {
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      throw new BadRequestException(
        'Некоректний формат URL. Посилання повинно починатися з http:// або https://',
      );
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000); // 45s timeout

      const res = await fetch(trimmedUrl, {
        headers: {
          'User-Agent': 'SmartFeedStudio-FeedParser/1.0 (+https://smartfeed.studio)',
          Accept: 'application/xml,text/xml,text/csv,text/plain,*/*',
          ...headers,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new BadRequestException(
          `Помилка завантаження фіду з віддаленого сервера. HTTP Статус: ${res.status} ${res.statusText}`,
        );
      }

      const text = await res.text();
      if (!text || !text.trim()) {
        throw new BadRequestException('Отримано пустий вміст за вказаним посиланням');
      }

      return text;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new BadRequestException(
          'Перевищено час очікування відповіді від сервера фіду (таймаут 45с)',
        );
      }
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(`Не вдалося завантажити фід за посиланням: ${err.message}`);
    }
  }

  parseFeedContent(
    content: string,
    supplierMarkup: { defaultMarginPercent?: number; defaultFixedMarkup?: number } = {},
    selectedCategoryIds?: string[],
  ): ParsedFeedResult {
    const trimmed = content.trim();

    let result: ParsedFeedResult;
    if (
      trimmed.startsWith('<?xml') ||
      trimmed.startsWith('<yml_catalog') ||
      trimmed.startsWith('<rss') ||
      trimmed.startsWith('<shop')
    ) {
      result = this.parseXmlFeed(trimmed, supplierMarkup);
    } else {
      result = this.parseCsvFeed(trimmed, supplierMarkup);
    }

    // If selective category filtering is active, filter products
    if (selectedCategoryIds && selectedCategoryIds.length > 0) {
      const selectedSet = new Set(selectedCategoryIds.map(String));
      result.products = result.products.filter(
        (p) => p.categoryId && selectedSet.has(String(p.categoryId)),
      );
    }

    return result;
  }

  private parseXmlFeed(
    xmlContent: string,
    supplierMarkup: { defaultMarginPercent?: number; defaultFixedMarkup?: number },
  ): ParsedFeedResult {
    let parsed: any;
    try {
      parsed = this.xmlParser.parse(xmlContent);
    } catch (e: any) {
      throw new BadRequestException(`Failed to parse XML feed: ${e.message}`);
    }

    let format = FeedFormat.XML_GENERIC;
    const categoryMap = new Map<string, { externalId: string; parentId?: string; name: string }>();
    const categoryCountMap = new Map<string, number>();
    const products: ParsedProductItem[] = [];

    // 1. Rozetka / Prom YML Structure: <yml_catalog><shop><categories>...<offers>...
    const shop = parsed.yml_catalog?.shop || parsed.shop;
    if (shop) {
      format = parsed.yml_catalog ? FeedFormat.YML_PROM : FeedFormat.XML_ROZETKA;

      // Extract categories
      if (shop.categories?.category) {
        const rawCats = Array.isArray(shop.categories.category)
          ? shop.categories.category
          : [shop.categories.category];
        for (const cat of rawCats) {
          if (typeof cat === 'object') {
            const extId = String(cat['@_id'] || cat.id || '');
            categoryMap.set(extId, {
              externalId: extId,
              parentId: cat['@_parentId'] ? String(cat['@_parentId']) : undefined,
              name: String(cat['#text'] || cat.name || cat['@_id'] || 'Без назви'),
            });
          } else {
            const extId = String(cat);
            categoryMap.set(extId, {
              externalId: extId,
              name: String(cat),
            });
          }
        }
      }

      // Extract offers
      if (shop.offers?.offer) {
        const rawOffers = Array.isArray(shop.offers.offer)
          ? shop.offers.offer
          : [shop.offers.offer];
        for (const offer of rawOffers) {
          const item = this.mapYmlOfferToProduct(offer, supplierMarkup, categoryMap);
          if (item) {
            products.push(item);
            if (item.categoryId) {
              categoryCountMap.set(
                item.categoryId,
                (categoryCountMap.get(item.categoryId) || 0) + 1,
              );
            }
          }
        }
      }
    } else if (parsed.rss?.channel?.item) {
      // 2. Google Shopping RSS Feed: <rss><channel><item>...
      format = FeedFormat.XML_GOOGLE;
      const rawItems = Array.isArray(parsed.rss.channel.item)
        ? parsed.rss.channel.item
        : [parsed.rss.channel.item];
      for (const item of rawItems) {
        const prod = this.mapGoogleItemToProduct(item, supplierMarkup);
        if (prod) products.push(prod);
      }
    } else {
      throw new BadRequestException(
        'Unrecognized XML feed format. Expected Rozetka/Prom YML or Google Shopping RSS feed.',
      );
    }

    // Build structured categories with SKU counts
    const categories: ParsedCategorySummary[] = Array.from(categoryMap.values()).map((cat) => ({
      id: cat.externalId,
      externalId: cat.externalId,
      parentId: cat.parentId,
      name: cat.name,
      productCount: categoryCountMap.get(cat.externalId) || 0,
    }));

    return { format, categories, products };
  }

  private mapYmlOfferToProduct(
    offer: any,
    supplierMarkup: { defaultMarginPercent?: number; defaultFixedMarkup?: number },
    categoryMap: Map<string, { externalId: string; parentId?: string; name: string }>,
  ): ParsedProductItem | null {
    const rawSku = offer.vendorCode || offer['@_id'] || offer.id;
    if (!rawSku) return null;

    const sku = String(rawSku).trim();
    const titleUk = String(offer.name_ua || offer.name || offer.title || sku).trim();
    const titleEn = offer.name_en ? String(offer.name_en).trim() : undefined;
    const descriptionUk =
      offer.description_ua || offer.description
        ? String(offer.description_ua || offer.description).trim()
        : undefined;
    const descriptionEn = offer.description_en ? String(offer.description_en).trim() : undefined;

    const rawCost = Number(offer.price_cost || offer.cost || offer.price || 0);
    const rawPrice = Number(offer.price || rawCost);
    const costPrice = isNaN(rawCost) ? 0 : rawCost;
    let price = isNaN(rawPrice) ? 0 : rawPrice;

    // Apply markup if configured
    const marginPct = supplierMarkup.defaultMarginPercent ?? 0;
    const fixedMarkup = supplierMarkup.defaultFixedMarkup ?? 0;
    if (marginPct > 0 || fixedMarkup > 0) {
      const baseForMarkup = costPrice > 0 ? costPrice : price;
      price = Math.round(baseForMarkup * (1 + marginPct / 100) + fixedMarkup);
    }

    const oldPrice =
      offer.oldprice || offer.oldPrice ? Number(offer.oldprice || offer.oldPrice) : undefined;
    const currency = String(offer.currencyId || 'UAH').toUpperCase();
    const stockQuantity = Number(
      offer.quantity || (offer['@_available'] === 'true' || offer['@_available'] === true ? 10 : 0),
    );
    const inStock =
      offer['@_available'] !== undefined
        ? offer['@_available'] === 'true' || offer['@_available'] === true
        : stockQuantity > 0;

    const categoryId = offer.categoryId ? String(offer.categoryId).trim() : undefined;
    const categoryName = categoryId ? categoryMap.get(categoryId)?.name : undefined;

    // Parse Images
    const images: Array<{ originalUrl: string; order: number; isMain: boolean }> = [];
    if (offer.picture) {
      const rawPics = Array.isArray(offer.picture) ? offer.picture : [offer.picture];
      rawPics.forEach((pic: any, idx: number) => {
        const url = String(typeof pic === 'object' ? pic['#text'] || '' : pic).trim();
        if (url.startsWith('http')) {
          images.push({ originalUrl: url, order: idx, isMain: idx === 0 });
        }
      });
    }

    // Parse Attributes / Params
    const attributes: Array<{
      nameUk: string;
      nameEn?: string;
      valueUk: string;
      valueEn?: string;
      unit?: string;
      order: number;
    }> = [];
    if (offer.param) {
      const rawParams = Array.isArray(offer.param) ? offer.param : [offer.param];
      rawParams.forEach((p: any, idx: number) => {
        if (typeof p === 'object' && p['@_name']) {
          attributes.push({
            nameUk: String(p['@_name']).trim(),
            valueUk: String(p['#text'] || '').trim(),
            unit: p['@_unit'] ? String(p['@_unit']).trim() : undefined,
            order: idx,
          });
        }
      });
    }

    return {
      sku,
      externalId: offer['@_id'] ? String(offer['@_id']) : undefined,
      vendorCode: offer.vendorCode ? String(offer.vendorCode) : undefined,
      titleUk,
      titleEn,
      descriptionUk,
      descriptionEn,
      vendor: offer.vendor ? String(offer.vendor).trim() : undefined,
      costPrice,
      price,
      oldPrice: isNaN(oldPrice as any) ? undefined : oldPrice,
      currency,
      stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity,
      inStock,
      categoryId,
      categoryName,
      images,
      attributes,
      rawPayload: offer,
    };
  }

  private mapGoogleItemToProduct(
    item: any,
    supplierMarkup: { defaultMarginPercent?: number; defaultFixedMarkup?: number },
  ): ParsedProductItem | null {
    const rawSku = item['g:id'] || item.id || item.guid;
    if (!rawSku) return null;

    const sku = String(rawSku).trim();
    const titleUk = String(item['g:title'] || item.title || sku).trim();
    const descriptionUk = item['g:description'] || item.description;

    const rawPriceStr = String(item['g:price'] || item.price || '0').replace(/[^\d.,]/g, '');
    const rawPrice = parseFloat(rawPriceStr.replace(',', '.')) || 0;
    let price = rawPrice;
    const costPrice = rawPrice;

    const marginPct = supplierMarkup.defaultMarginPercent ?? 0;
    const fixedMarkup = supplierMarkup.defaultFixedMarkup ?? 0;
    if (marginPct > 0 || fixedMarkup > 0) {
      price = Math.round(costPrice * (1 + marginPct / 100) + fixedMarkup);
    }

    const availability = String(item['g:availability'] || '').toLowerCase();
    const inStock = availability.includes('in stock') || availability === 'in_stock';

    const images: Array<{ originalUrl: string; order: number; isMain: boolean }> = [];
    const mainImg = item['g:image_link'] || item.image_link;
    if (mainImg && String(mainImg).startsWith('http')) {
      images.push({ originalUrl: String(mainImg).trim(), order: 0, isMain: true });
    }

    return {
      sku,
      titleUk,
      descriptionUk: descriptionUk ? String(descriptionUk).trim() : undefined,
      costPrice,
      price,
      currency: 'UAH',
      stockQuantity: inStock ? 10 : 0,
      inStock,
      images,
      attributes: [],
      rawPayload: item,
    };
  }

  private parseCsvFeed(
    csvContent: string,
    supplierMarkup: { defaultMarginPercent?: number; defaultFixedMarkup?: number },
  ): ParsedFeedResult {
    let records: any[];
    try {
      records = parseCsv(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (e: any) {
      throw new BadRequestException(`Failed to parse CSV feed: ${e.message}`);
    }

    const products: ParsedProductItem[] = [];

    for (const row of records) {
      const sku = row.sku || row.SKU || row['Артикул'] || row['Код'] || row.id || row.ID;
      const titleUk =
        row.title || row.name || row.Name || row['Назва'] || row['Найменування'] || sku;

      if (!sku || !titleUk) continue;

      const rawPrice =
        parseFloat(String(row.price || row.Price || row['Ціна'] || '0').replace(',', '.')) || 0;
      const rawCost =
        parseFloat(
          String(row.costPrice || row['Закупівля'] || row.price_cost || rawPrice).replace(',', '.'),
        ) || rawPrice;
      let price = rawPrice;

      const marginPct = supplierMarkup.defaultMarginPercent ?? 0;
      const fixedMarkup = supplierMarkup.defaultFixedMarkup ?? 0;
      if (marginPct > 0 || fixedMarkup > 0) {
        price = Math.round(rawCost * (1 + marginPct / 100) + fixedMarkup);
      }

      const stockQuantity =
        parseInt(String(row.stockQuantity || row.quantity || row['Кількість'] || '10'), 10) || 0;
      const inStock =
        row.inStock !== undefined
          ? String(row.inStock).toLowerCase() === 'true' || String(row.inStock) === '1'
          : stockQuantity > 0;

      const images: Array<{ originalUrl: string; order: number; isMain: boolean }> = [];
      const imageCol = row.image || row.images || row['Фото'] || row['Зображення'] || row.picture;
      if (imageCol) {
        const splitUrls = String(imageCol)
          .split(/[,;|\s]+/)
          .filter((u) => u.startsWith('http'));
        splitUrls.forEach((url, idx) => {
          images.push({ originalUrl: url, order: idx, isMain: idx === 0 });
        });
      }

      products.push({
        sku: String(sku).trim(),
        titleUk: String(titleUk).trim(),
        descriptionUk:
          row.description || row.Description || row['Опис']
            ? String(row.description || row.Description || row['Опис']).trim()
            : undefined,
        vendor:
          row.vendor || row.brand || row['Бренд'] || row['Виробник']
            ? String(row.vendor || row.brand || row['Бренд'] || row['Виробник']).trim()
            : undefined,
        costPrice: rawCost,
        price,
        currency: row.currency || row['Валюта'] || 'UAH',
        stockQuantity,
        inStock,
        images,
        attributes: [],
        rawPayload: row,
      });
    }

    return {
      format: FeedFormat.CSV,
      categories: [],
      products,
    };
  }
}
