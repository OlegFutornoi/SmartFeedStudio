import type {
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierPricingRuleDto,
  CreateSupplierPricingRuleDto,
  UpdateSupplierPricingRuleDto,
  ExportChannelDto,
  CreateExportChannelDto,
  UpdateExportChannelDto,
  ExportChannelPricingRuleDto,
  CreateExportChannelPricingRuleDto,
  PriceSimulationRequestDto,
  PriceSimulationResultDto,
  ProductDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
} from '@smartfeed/shared';
import { FeedFormat, ProductStatus } from '@smartfeed/shared';

export class MockDatabaseDriver {
  private suppliers: SupplierDto[] = [];
  private pricingRules: Map<string, SupplierPricingRuleDto[]> = new Map();
  private exportChannels: ExportChannelDto[] = [];
  private exportPricingRules: Map<string, ExportChannelPricingRuleDto[]> = new Map();
  private products: ProductDto[] = [];

  constructor() {
    this.checkAndSeedIfEnabled();
  }

  public checkAndSeedIfEnabled(): void {
    if (
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('smartfeed_e2e_seed') === 'true'
    ) {
      this.seedDefaultData();
    }
  }

  public reset(): void {
    this.suppliers = [];
    this.pricingRules.clear();
    this.exportChannels = [];
    this.exportPricingRules.clear();
    this.products = [];
    this.checkAndSeedIfEnabled();
  }

  public seedDefaultData(): void {
    const defaultSupplierId = 'sup_demo_01';
    this.suppliers = [
      {
        id: defaultSupplierId,
        userId: 'usr_admin',
        name: 'Brain Distribution',
        code: 'BRAIN',
        defaultMarginPercent: 15,
        defaultFixedMarkup: 0,
        isActive: true,
        activeFeedsCount: 2,
        productsCount: 450,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    this.pricingRules.set(defaultSupplierId, [
      {
        id: 'rule_demo_01',
        supplierId: defaultSupplierId,
        categoryId: 'cat_01',
        categoryNameUk: 'Ноутбуки',
        minPrice: 10000,
        maxPrice: 50000,
        marginPercent: 12,
        fixedMarkup: 200,
        priority: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    this.exportChannels = [
      {
        id: 'chan_demo_01',
        userId: 'usr_admin',
        name: 'Rozetka Main Feed',
        marketplaceCode: 'ROZETKA',
        feedFormat: FeedFormat.XML_ROZETKA,
        slug: 'rozetka-main',
        exportUrl: 'http://localhost:1420/export/rozetka-main.xml',
        commissionPercent: 12,
        extraFixedCost: 50,
        applyReverseMarkup: true,
        isActive: true,
        pricingRulesCount: 1,
        totalProductsCount: 320,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    this.exportPricingRules.set('chan_demo_01', [
      {
        id: 'exp_rule_01',
        exportChannelId: 'chan_demo_01',
        categoryId: 'cat_01',
        categoryNameUk: 'Ноутбуки',
        commissionPercent: 10,
        marginPercent: 22,
        fixedMarkup: 150,
        priority: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    // Seed 15 demo products
    const categories = ['Ноутбуки', 'Смартфони', 'Монітори', 'Аксесуари'];
    this.products = Array.from({ length: 15 }, (_, i) => {
      const cat = categories[i % categories.length];
      const basePrice = (i + 1) * 1200;
      return {
        id: `prod_${i + 1}`,
        catalogId: 'cat_main',
        supplierId: defaultSupplierId,
        supplierName: 'Brain Distribution',
        supplierCode: 'BRAIN',
        sku: `SKU-DEMO-${(i + 1).toString().padStart(4, '0')}`,
        titleUk: `${cat} Pro Model ${i + 1}`,
        categoryId: `cat_${(i % categories.length) + 1}`,
        categoryNameUk: cat,
        vendor: 'TechBrand',
        price: basePrice * 1.15,
        costPrice: basePrice,
        stockQuantity: 10 + i * 2,
        inStock: true,
        currency: 'UAH',
        status: ProductStatus.ACTIVE,
        images: [],
        attributes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  // ==========================================
  // Suppliers
  // ==========================================

  getSuppliers(search?: string): SupplierDto[] {
    let result = [...this.suppliers];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
      );
    }
    return result;
  }

  getSupplierById(id: string): SupplierDto | null {
    return this.suppliers.find((s) => s.id === id) || null;
  }

  createSupplier(payload: CreateSupplierDto): SupplierDto {
    const existing = this.suppliers.find(
      (s) => s.code.toUpperCase() === payload.code.trim().toUpperCase(),
    );
    if (existing) {
      throw new Error(`Постачальник з кодом '${payload.code}' вже існує`);
    }

    const newSupplier: SupplierDto = {
      id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'usr_admin',
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      defaultMarginPercent: payload.defaultMarginPercent ?? 0,
      defaultFixedMarkup: payload.defaultFixedMarkup ?? 0,
      contactPhone: payload.contactPhone,
      contactEmail: payload.contactEmail,
      website: payload.website,
      notes: payload.notes,
      isActive: payload.isActive ?? true,
      activeFeedsCount: 0,
      productsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.suppliers.unshift(newSupplier);
    return newSupplier;
  }

  updateSupplier(id: string, payload: UpdateSupplierDto): SupplierDto {
    const index = this.suppliers.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Постачальника не знайдено');
    }

    const updated = {
      ...this.suppliers[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.suppliers[index] = updated;
    return updated;
  }

  deleteSupplier(id: string): boolean {
    const initialLen = this.suppliers.length;
    this.suppliers = this.suppliers.filter((s) => s.id !== id);
    this.pricingRules.delete(id);
    this.products = this.products.filter((p) => p.supplierId !== id);
    return this.suppliers.length < initialLen;
  }

  // ==========================================
  // Pricing Rules
  // ==========================================

  getPricingRules(supplierId: string): SupplierPricingRuleDto[] {
    return this.pricingRules.get(supplierId) || [];
  }

  createPricingRule(
    supplierId: string,
    payload: CreateSupplierPricingRuleDto,
  ): SupplierPricingRuleDto {
    const list = this.pricingRules.get(supplierId) || [];
    const newRule: SupplierPricingRuleDto = {
      id: `prule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      supplierId,
      categoryId: payload.categoryId || null,
      minPrice: payload.minPrice !== undefined ? Number(payload.minPrice) : null,
      maxPrice: payload.maxPrice !== undefined ? Number(payload.maxPrice) : null,
      marginPercent: Number(payload.marginPercent || 0),
      fixedMarkup: Number(payload.fixedMarkup || 0),
      priority: payload.priority || 0,
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(newRule);
    this.pricingRules.set(supplierId, list);
    return newRule;
  }

  updatePricingRule(
    supplierId: string,
    ruleId: string,
    payload: UpdateSupplierPricingRuleDto,
  ): SupplierPricingRuleDto {
    const list = this.pricingRules.get(supplierId) || [];
    const index = list.findIndex((r) => r.id === ruleId);
    if (index === -1) {
      throw new Error('Правило націнки не знайдено');
    }

    const updated: SupplierPricingRuleDto = {
      ...list[index],
      ...payload,
      minPrice: payload.minPrice !== undefined ? Number(payload.minPrice) : list[index].minPrice,
      maxPrice: payload.maxPrice !== undefined ? Number(payload.maxPrice) : list[index].maxPrice,
      marginPercent:
        payload.marginPercent !== undefined
          ? Number(payload.marginPercent)
          : list[index].marginPercent,
      fixedMarkup:
        payload.fixedMarkup !== undefined ? Number(payload.fixedMarkup) : list[index].fixedMarkup,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.pricingRules.set(supplierId, list);
    return updated;
  }

  deletePricingRule(supplierId: string, ruleId: string): boolean {
    const list = this.pricingRules.get(supplierId) || [];
    const filtered = list.filter((r) => r.id !== ruleId);
    this.pricingRules.set(supplierId, filtered);
    return filtered.length < list.length;
  }

  // ==========================================
  // Export Channels
  // ==========================================

  getExportChannels(): ExportChannelDto[] {
    return [...this.exportChannels];
  }

  getExportChannelById(id: string): ExportChannelDto | null {
    return this.exportChannels.find((c) => c.id === id) || null;
  }

  createExportChannel(payload: CreateExportChannelDto): ExportChannelDto {
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newChannel: ExportChannelDto = {
      id: `chan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'usr_admin',
      name: payload.name.trim(),
      marketplaceCode: payload.marketplaceCode || 'ROZETKA',
      feedFormat: payload.feedFormat || FeedFormat.XML_ROZETKA,
      slug,
      exportUrl: `http://localhost:1420/export/${slug}.xml`,
      commissionPercent: payload.commissionPercent ?? 10,
      extraFixedCost: payload.extraFixedCost ?? 0,
      applyReverseMarkup: payload.applyReverseMarkup ?? true,
      isActive: payload.isActive ?? true,
      pricingRulesCount: 0,
      totalProductsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.exportChannels.unshift(newChannel);
    return newChannel;
  }

  updateExportChannel(id: string, payload: UpdateExportChannelDto): ExportChannelDto {
    const index = this.exportChannels.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Канал експорту не знайдено');
    }

    const updated = {
      ...this.exportChannels[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    this.exportChannels[index] = updated;
    return updated;
  }

  deleteExportChannel(id: string): boolean {
    const initialLen = this.exportChannels.length;
    this.exportChannels = this.exportChannels.filter((c) => c.id !== id);
    this.exportPricingRules.delete(id);
    return this.exportChannels.length < initialLen;
  }

  getExportPricingRules(channelId: string): ExportChannelPricingRuleDto[] {
    return this.exportPricingRules.get(channelId) || [];
  }

  createExportPricingRule(
    channelId: string,
    payload: CreateExportChannelPricingRuleDto,
  ): ExportChannelPricingRuleDto {
    const list = this.exportPricingRules.get(channelId) || [];
    const newRule: ExportChannelPricingRuleDto = {
      id: `exp_rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exportChannelId: channelId,
      categoryId: payload.categoryId || null,
      commissionPercent:
        payload.commissionPercent !== undefined ? Number(payload.commissionPercent) : null,
      marginPercent: payload.marginPercent !== undefined ? Number(payload.marginPercent) : null,
      fixedMarkup: payload.fixedMarkup !== undefined ? Number(payload.fixedMarkup) : null,
      priority: payload.priority || 0,
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(newRule);
    this.exportPricingRules.set(channelId, list);

    // Update rules count on channel
    const chan = this.exportChannels.find((c) => c.id === channelId);
    if (chan) {
      chan.pricingRulesCount = list.length;
    }

    return newRule;
  }

  deleteExportPricingRule(channelId: string, ruleId: string): boolean {
    const list = this.exportPricingRules.get(channelId) || [];
    const filtered = list.filter((r) => r.id !== ruleId);
    this.exportPricingRules.set(channelId, filtered);

    const chan = this.exportChannels.find((c) => c.id === channelId);
    if (chan) {
      chan.pricingRulesCount = filtered.length;
    }

    return filtered.length < list.length;
  }

  simulatePrice(payload: PriceSimulationRequestDto): PriceSimulationResultDto {
    const costPrice = Number(payload.costPrice || 0);
    const supplierMargin = Number(payload.supplierMarginPercent || 0) / 100;
    const supplierFixed = Number(payload.supplierFixedMarkup || 0);
    const commissionPercent = Number(payload.marketplaceCommissionPercent || 15) / 100;
    const extraFixed = Number(payload.marketplaceExtraFixedCost || 0);

    const basePrice = Math.round((costPrice * (1 + supplierMargin) + supplierFixed) * 100) / 100;
    const supplierMarkupProfit = Math.round((basePrice - costPrice) * 100) / 100;

    let shelfPrice = basePrice;
    if (payload.applyReverseMarkup && commissionPercent < 1) {
      shelfPrice = Math.round(((basePrice + extraFixed) / (1 - commissionPercent)) * 100) / 100;
    } else {
      shelfPrice = Math.round((basePrice * (1 + commissionPercent) + extraFixed) * 100) / 100;
    }

    const commissionAmount = Math.round(shelfPrice * commissionPercent * 100) / 100;
    const payoutAmount = Math.round((shelfPrice - commissionAmount - extraFixed) * 100) / 100;
    const netProfit = Math.round((payoutAmount - costPrice) * 100) / 100;
    const netMarginPercent = costPrice > 0 ? Math.round((netProfit / costPrice) * 1000) / 10 : 0;
    const returnOnSalesPercent =
      shelfPrice > 0 ? Math.round((netProfit / shelfPrice) * 1000) / 10 : 0;

    return {
      costPrice,
      basePrice,
      supplierMarkupProfit,
      shelfPrice,
      commissionAmount,
      extraFixedCost: extraFixed,
      payoutAmount,
      netProfit,
      netMarginPercent,
      returnOnSalesPercent,
    };
  }

  // ==========================================
  // Products & Categories
  // ==========================================

  getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
  }): {
    items: ProductDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    let filtered = [...this.products];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.titleUk.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryNameUk?.toLowerCase().includes(q),
      );
    }

    if (params.category) {
      filtered = filtered.filter(
        (p) => p.categoryNameUk === params.category || p.categoryId === params.category,
      );
    }

    if (params.supplierId) {
      filtered = filtered.filter((p) => p.supplierId === params.supplierId);
    }

    if (params.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= params.minPrice!);
    }

    if (params.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= params.maxPrice!);
    }

    if (params.inStockOnly) {
      filtered = filtered.filter((p) => p.inStock);
    }

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 50);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const items = filtered.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  getCategoriesSummary(supplierId?: string): ProductCategorySummaryDto[] {
    let pool = this.products;
    if (supplierId) {
      pool = pool.filter((p) => p.supplierId === supplierId);
    }

    const map = new Map<string, { id: string; count: number }>();
    for (const p of pool) {
      const name = p.categoryNameUk || 'Без категорії';
      const entry = map.get(name) || { id: p.categoryId || 'cat_none', count: 0 };
      entry.count += 1;
      map.set(name, entry);
    }

    return Array.from(map.entries()).map(([nameUk, data]) => ({
      id: data.id,
      nameUk,
      productCount: data.count,
    }));
  }

  bulkDeleteProducts(payload: BulkDeleteProductsDto): BulkDeleteResultDto {
    const initialCount = this.products.length;

    if (payload.supplierIds && payload.supplierIds.length > 0) {
      const set = new Set(payload.supplierIds);
      this.products = this.products.filter((p) => !set.has(p.supplierId));
    } else if (payload.categoryIds && payload.categoryIds.length > 0) {
      const set = new Set(payload.categoryIds);
      this.products = this.products.filter((p) => !p.categoryId || !set.has(p.categoryId));
    } else if (payload.productIds && payload.productIds.length > 0) {
      const set = new Set(payload.productIds);
      this.products = this.products.filter((p) => !set.has(p.id));
    }

    const deletedCount = initialCount - this.products.length;
    return {
      deletedCount,
      remainingCount: this.products.length,
      message: `Успішно видалено ${deletedCount} товарів`,
    };
  }

  bulkUpsertProducts(products: ProductDto[]): { count: number } {
    const existingMap = new Map<string, number>();
    this.products.forEach((p, idx) => {
      existingMap.set(`${p.supplierId}_${p.sku}`, idx);
    });

    for (const newProd of products) {
      const key = `${newProd.supplierId}_${newProd.sku}`;
      const existingIndex = existingMap.get(key);
      if (existingIndex !== undefined) {
        this.products[existingIndex] = {
          ...this.products[existingIndex],
          ...newProd,
          updatedAt: new Date().toISOString(),
        };
      } else {
        this.products.push(newProd);
        existingMap.set(key, this.products.length - 1);
      }
    }

    // Update supplier product counts
    const countsBySupplier = new Map<string, number>();
    for (const p of this.products) {
      countsBySupplier.set(p.supplierId, (countsBySupplier.get(p.supplierId) || 0) + 1);
    }
    for (const s of this.suppliers) {
      if (countsBySupplier.has(s.id)) {
        s.productsCount = countsBySupplier.get(s.id)!;
      }
    }

    return { count: products.length };
  }
}

export const mockDatabaseDriver = new MockDatabaseDriver();

if (typeof window !== 'undefined') {
  (window as unknown as { __MOCK_LOCAL_DB__?: MockDatabaseDriver }).__MOCK_LOCAL_DB__ =
    mockDatabaseDriver;
}
