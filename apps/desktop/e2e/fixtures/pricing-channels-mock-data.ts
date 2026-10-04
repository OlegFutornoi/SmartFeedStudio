import type { Page } from '@playwright/test';

export const mockUser = {
  id: 'usr_pricing_123',
  email: 'pricing.rules@smartfeed.local',
  fullName: 'Pricing Test User',
  role: 'USER',
  organization: {
    id: 'org-test-1',
    name: 'SmartFeed Store LLC',
    role: 'OWNER',
  },
};

export const mockLicenseState = {
  id: 'lic-1',
  userId: mockUser.id,
  planType: 'PRO',
  isActive: true,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isExpired: false,
  daysRemaining: 30,
};

export const mockQuotas = {
  planCode: 'PRO',
  planNameUk: 'PRO Тариф',
  planNameEn: 'PRO Plan',
  isExpired: false,
  suppliers: {
    used: 1,
    max: 10,
    isUnlimited: false,
    percentUsed: 10,
    isExceeded: false,
    remaining: 9,
  },
  products: {
    used: 250,
    max: 5000,
    isUnlimited: false,
    percentUsed: 5,
    isExceeded: false,
    remaining: 4750,
  },
  feeds: {
    used: 1,
    max: 20,
    isUnlimited: false,
    percentUsed: 5,
    isExceeded: false,
    remaining: 19,
  },
  aiCredits: {
    used: 10,
    max: 500,
    isUnlimited: false,
    percentUsed: 2,
    isExceeded: false,
    remaining: 490,
  },
  s3Storage: {
    used: 50,
    max: 1000,
    isUnlimited: false,
    percentUsed: 5,
    isExceeded: false,
    remaining: 950,
  },
  teamSeats: {
    used: 1,
    max: 5,
    isUnlimited: false,
    percentUsed: 20,
    isExceeded: false,
    remaining: 4,
  },
};

export const mockSupplier = {
  id: 'sup_test_1',
  userId: mockUser.id,
  name: 'Tech Master Supplier',
  code: 'TECH_01',
  contactPhone: '+380501112233',
  contactEmail: 'tech@supplier.ua',
  website: 'https://tech-master.ua',
  defaultMarginPercent: 20,
  defaultFixedMarkup: 10,
  isActive: true,
  productsCount: 150,
  activeFeedsCount: 1,
  createdAt: new Date().toISOString(),
};

export interface MockPricingRule {
  id: string;
  supplierId: string;
  categoryId: string | null;
  categoryNameUk: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  marginPercent: number;
  fixedMarkup: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export interface MockExportChannel {
  id: string;
  userId: string;
  name: string;
  marketplaceCode: string;
  feedFormat: string;
  commissionPercent: number;
  extraFixedCost: number;
  applyReverseMarkup: boolean;
  slug: string;
  isActive: boolean;
  catalogId: string | null;
  catalogName: string;
  totalProductsCount: number;
  exportUrl: string;
  createdAt: string;
}

export interface PricingChannelsState {
  rules: MockPricingRule[];
  channels: MockExportChannel[];
}

export async function setupPricingChannelsRoutes(page: Page, state: PricingChannelsState) {
  await page.addInitScript((user) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('smartfeed_access_token', 'mock-valid-token');
    window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
    window.localStorage.setItem('smartfeed_language', 'uk');
  }, mockUser);

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    });
  });

  await page.route('**/api/licenses/my', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLicenseState),
    });
  });

  await page.route('**/api/licenses/quotas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockQuotas),
    });
  });

  await page.route('**/api/navigation', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'nav-1',
          key: 'suppliers',
          labelUk: 'Постачальники',
          labelEn: 'Suppliers',
          path: '/suppliers',
          icon: 'Building2',
          isVisible: true,
          targetApp: 'DESKTOP',
        },
        {
          id: 'nav-2',
          key: 'catalogs',
          labelUk: 'Каталоги товарів',
          labelEn: 'Catalogs',
          path: '/catalogs',
          icon: 'Layers',
          isVisible: true,
          targetApp: 'DESKTOP',
        },
      ]),
    });
  });

  await page.route('**/api/suppliers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockSupplier]),
    });
  });

  await page.route('**/api/products/categories-summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'cat-1', nameUk: 'Електроніка', nameEn: 'Electronics', productCount: 80 },
        { id: 'cat-2', nameUk: 'Аксесуари', nameEn: 'Accessories', productCount: 70 },
      ]),
    });
  });

  await page.route('**/api/suppliers/*/pricing-rules', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.rules),
      });
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newRule: MockPricingRule = {
        id: `rule-${Date.now()}`,
        supplierId: mockSupplier.id,
        categoryId: body.categoryId || null,
        categoryNameUk:
          body.categoryId === 'cat-1' ? 'Електроніка' : body.categoryId ? 'Аксесуари' : null,
        minPrice: body.minPrice || null,
        maxPrice: body.maxPrice || null,
        marginPercent: body.marginPercent || 0,
        fixedMarkup: body.fixedMarkup || 0,
        priority: body.priority || 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      state.rules.push(newRule);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newRule),
      });
    }
  });

  await page.route('**/api/suppliers/*/pricing-rules/*', async (route) => {
    if (route.request().method() === 'DELETE') {
      const ruleId = route.request().url().split('/').pop();
      state.rules = state.rules.filter((r) => r.id !== ruleId);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    }
  });

  await page.route('**/api/export/channels', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(state.channels),
      });
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const newChannel: MockExportChannel = {
        id: `channel-${Date.now()}`,
        userId: mockUser.id,
        name: body.name,
        marketplaceCode: body.marketplaceCode || 'ROZETKA',
        feedFormat: body.feedFormat || 'XML_ROZETKA',
        commissionPercent: body.commissionPercent || 15,
        extraFixedCost: body.extraFixedCost || 0,
        applyReverseMarkup: body.applyReverseMarkup ?? true,
        slug: 'rozetka-main-feed-123',
        isActive: true,
        catalogId: body.catalogId || null,
        catalogName: 'Основний каталог',
        totalProductsCount: 150,
        exportUrl: '/api/export/feed/rozetka-main-feed-123',
        createdAt: new Date().toISOString(),
      };
      state.channels.push(newChannel);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(newChannel),
      });
    }
  });
}
