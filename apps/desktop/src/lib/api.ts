import type {
  AuthResponseDto,
  UserProfile,
  Role,
  NavigationItemDto,
  CheckoutResponseDto,
  OrganizationMemberDto,
  SupplierDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  ProductDto,
  UserQuotasDto,
  ProductCategorySummaryDto,
  BulkDeleteProductsDto,
  BulkDeleteResultDto,
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
} from '@smartfeed/shared';
import { localDb } from '../services/local-db';
import { isTauri } from './runtime';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const TOKEN_KEY = 'smartfeed_access_token';
export const REFRESH_TOKEN_KEY = 'smartfeed_refresh_token';
export const USER_KEY = 'smartfeed_user_profile';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  role?: Role;
}

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Global Refresh Lock to prevent duplicate concurrent refresh requests
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Transparently refresh the active authentication session using stored Refresh Token.
 */
export async function refreshAuthSession(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // If refresh token is truly expired or invalid, clear stored session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return null;
      }

      const data: AuthResponseDto = await response.json();
      if (data.tokens?.accessToken) {
        localStorage.setItem(TOKEN_KEY, data.tokens.accessToken);
        if (data.tokens.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refreshToken);
        }
        if (data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        return data.tokens.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Authenticated Fetch wrapper with automatic silent 401 token refresh & request retry.
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  tokenOverride?: string,
): Promise<Response> {
  const token = tokenOverride || localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, transparently refresh session and retry request
  if (response.status === 401) {
    const newToken = await refreshAuthSession();
    if (newToken) {
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  return response;
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponseDto> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Помилка авторизації. Перевірте введені дані.';
    throw new ApiError(message, response.status, data);
  }

  const authData = data as AuthResponseDto;
  if (authData.tokens?.accessToken) {
    localStorage.setItem(TOKEN_KEY, authData.tokens.accessToken);
    if (authData.tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }
  }

  return authData;
}

export async function registerUser(credentials: RegisterCredentials): Promise<AuthResponseDto> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Помилка реєстрації. Перевірте введені дані.';
    throw new ApiError(message, response.status, data);
  }

  const authData = data as AuthResponseDto;
  if (authData.tokens?.accessToken) {
    localStorage.setItem(TOKEN_KEY, authData.tokens.accessToken);
    if (authData.tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }
  }

  return authData;
}

export async function getCurrentUser(token?: string): Promise<UserProfile> {
  const response = await fetchWithAuth('/auth/me', { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Не вдалося завантажити профіль користувача';
    throw new ApiError(message, response.status, data);
  }

  return data as UserProfile;
}

export async function getDesktopNavigation(token?: string): Promise<NavigationItemDto[]> {
  const response = await fetchWithAuth('/navigation?app=DESKTOP', { method: 'GET' }, token);

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    return [];
  }

  return data as NavigationItemDto[];
}

export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; message: string; resetToken?: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося надіслати запит на відновлення пароля';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося встановити новий пароль';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function getMyLicense(token?: string): Promise<any> {
  const response = await fetchWithAuth('/licenses/my', { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || 'Не вдалося завантажити статус ліцензії';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function getTariffPlans(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/plans`, {
    method: 'GET',
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    return [];
  }

  return data;
}

export function getCheckoutUrl(
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): string {
  const baseUrl = 'https://checkout.smartfeed.studio/pay';
  const query = new URLSearchParams({
    plan: planCode.toUpperCase(),
    interval: billingInterval,
  });
  return `${baseUrl}?${query.toString()}`;
}

export async function selectTariffPlan(
  token: string,
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): Promise<any> {
  const response = await fetchWithAuth(
    '/licenses/select-plan',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planCode, billingInterval }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося обрати тарифний план';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export async function createPaymentCheckout(
  token: string,
  planCode: string,
  billingInterval: 'monthly' | 'yearly' = 'monthly',
): Promise<CheckoutResponseDto> {
  const response = await fetchWithAuth(
    '/payments/checkout',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planCode, billingInterval }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося створити платіжний рахунок';
    throw new ApiError(message, response.status, data);
  }

  return data as CheckoutResponseDto;
}

export async function simulateSandboxPayment(
  token: string,
  orderReference: string,
  status?: 'Approved' | 'Declined',
  reason?: string,
  cardDetails?: { cardPan?: string; cardType?: string; issuerBank?: string },
): Promise<any> {
  const response = await fetchWithAuth(
    '/payments/simulate-sandbox-webhook',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderReference,
        status,
        reason,
        cardPan: cardDetails?.cardPan,
        cardType: cardDetails?.cardType,
        issuerBank: cardDetails?.issuerBank,
      }),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося виконати тестову симуляцію оплати';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

// ==========================================
// Organization & Team Management API
// ==========================================

export async function getUserOrganizations(token?: string): Promise<any[]> {
  const response = await fetchWithAuth('/organizations', { method: 'GET' }, token);

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data;
}

export async function getOrganizationById(token: string, id: string): Promise<any> {
  const response = await fetchWithAuth(`/organizations/${id}`, { method: 'GET' }, token);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося отримати дані організації';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function getOrganizationMembers(
  token: string,
  id: string,
): Promise<OrganizationMemberDto[]> {
  const response = await fetchWithAuth(`/organizations/${id}/members`, { method: 'GET' }, token);

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data as OrganizationMemberDto[];
}

export async function inviteOrganizationMember(
  token: string,
  id: string,
  payload: { email: string; role?: string },
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}/members`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося запросити учасника';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function removeOrganizationMember(
  token: string,
  id: string,
  memberId: string,
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}/members/${memberId}`,
    {
      method: 'DELETE',
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося видалити учасника';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function updateOrganization(
  token: string,
  id: string,
  payload: { name: string },
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося оновити організацію';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export async function getOrganizationInvitations(token: string, id: string): Promise<any[]> {
  const response = await fetchWithAuth(
    `/organizations/${id}/invitations`,
    { method: 'GET' },
    token,
  );

  const data = await response.json().catch(() => []);
  if (!response.ok) {
    return [];
  }
  return data;
}

export async function revokeOrganizationInvitation(
  token: string,
  id: string,
  invitationId: string,
): Promise<any> {
  const response = await fetchWithAuth(
    `/organizations/${id}/invitations/${invitationId}`,
    {
      method: 'DELETE',
    },
    token,
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося скасувати запрошення';
    throw new ApiError(message, response.status, data);
  }
  return data;
}

export interface InvitationDetails {
  organizationName: string;
  email: string;
  role: string;
  expiresAt: string;
  isExistingUser?: boolean;
  inviterName?: string | null;
}

export async function getInvitationDetails(token: string): Promise<InvitationDetails> {
  const response = await fetch(`${API_BASE_URL}/invitations/${token}`, {
    method: 'GET',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Запрошення не знайдено або термін його дії закінчився';
    throw new ApiError(message, response.status, data);
  }
  return data as InvitationDetails;
}

export async function acceptInvitation(payload: {
  token: string;
  fullName?: string;
  password?: string;
}): Promise<AuthResponseDto> {
  const response = await fetch(`${API_BASE_URL}/invitations/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Не вдалося прийняти запрошення';
    throw new ApiError(message, response.status, data);
  }

  const authData = data as AuthResponseDto;
  if (authData.tokens?.accessToken) {
    localStorage.setItem(TOKEN_KEY, authData.tokens.accessToken);
    if (authData.tokens.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.tokens.refreshToken);
    }
    if (authData.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }
  }

  return authData;
}

// ==========================================
// Suppliers & Catalogs API (Local-First via localDb)
// ==========================================

export async function getSuppliers(token?: string, search?: string): Promise<SupplierDto[]> {
  if (isTauri()) {
    return localDb.suppliers.getSuppliers(search);
  }

  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetchWithAuth(`/suppliers${query}`, { method: 'GET' }, token);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}

  return localDb.suppliers.getSuppliers(search);
}

export async function getSupplierById(id: string, token?: string): Promise<SupplierDto> {
  if (isTauri()) {
    const supplier = await localDb.suppliers.getSupplierById(id);
    if (supplier) return supplier;
    throw new ApiError('Постачальника не знайдено', 404);
  }

  try {
    const response = await fetchWithAuth(`/suppliers/${id}`, { method: 'GET' }, token);
    if (response.ok) {
      const data = await response.json();
      if (data?.id) return data as SupplierDto;
    }
  } catch {}

  const supplier = await localDb.suppliers.getSupplierById(id);
  if (!supplier) {
    throw new ApiError('Постачальника не знайдено', 404);
  }
  return supplier;
}

export async function createSupplier(
  payload: CreateSupplierDto,
  token?: string,
): Promise<SupplierDto> {
  if (isTauri()) {
    return localDb.suppliers.createSupplier(payload);
  }

  try {
    const response = await fetchWithAuth(
      '/suppliers',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token,
    );
    if (response.ok) {
      return (await response.json()) as SupplierDto;
    }
  } catch {}

  return localDb.suppliers.createSupplier(payload);
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierDto,
  token?: string,
): Promise<SupplierDto> {
  if (isTauri()) {
    return localDb.suppliers.updateSupplier(id, payload);
  }

  try {
    const response = await fetchWithAuth(
      `/suppliers/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token,
    );
    if (response.ok) {
      return (await response.json()) as SupplierDto;
    }
  } catch {}

  return localDb.suppliers.updateSupplier(id, payload);
}

export async function deleteSupplier(id: string, token?: string): Promise<{ success: boolean }> {
  if (isTauri()) {
    const success = await localDb.suppliers.deleteSupplier(id);
    return { success };
  }

  try {
    const response = await fetchWithAuth(`/suppliers/${id}`, { method: 'DELETE' }, token);
    if (response.ok) {
      return (await response.json()) as { success: boolean };
    }
  } catch {}

  const success = await localDb.suppliers.deleteSupplier(id);
  return { success };
}

export async function getProducts(
  params?: Record<string, string | number | boolean>,
  token?: string,
): Promise<{ items: ProductDto[]; total: number; page: number; pageSize: number }> {
  if (isTauri()) {
    const res = await localDb.products.getProducts(params as any);
    return {
      items: res.items,
      total: res.total,
      page: res.page,
      pageSize: res.limit,
    };
  }

  try {
    const query = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    const response = await fetchWithAuth(`/products${query}`, { method: 'GET' }, token);
    if (response.ok) {
      return await response.json();
    }
  } catch {}

  const res = await localDb.products.getProducts(params as any);
  return {
    items: res.items,
    total: res.total,
    page: res.page,
    pageSize: res.limit,
  };
}

export async function getUserQuotas(token?: string): Promise<UserQuotasDto | null> {
  const response = await fetchWithAuth('/licenses/quotas', { method: 'GET' }, token);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return null;
  }
  return data as UserQuotasDto;
}

export interface FeedCategoryItem {
  id: string;
  externalId: string;
  name: string;
  parentId?: string;
  productCount: number;
}

export interface FeedAnalysisResult {
  format: string;
  totalDetected: number;
  categoriesCount: number;
  categories: FeedCategoryItem[];
  sampleCategories: Array<{ externalId: string; parentId?: string; name: string }>;
  sampleProducts: Array<{
    sku: string;
    titleUk: string;
    costPrice: number;
    price: number;
    currency: string;
    stockQuantity: number;
    inStock: boolean;
    images?: Array<{ originalUrl: string; isMain?: boolean }>;
    categoryName?: string;
  }>;
  url?: string;
}

export interface ImportFeedResultDto {
  feedSourceId?: string;
  totalItems: number;
  createdItems: number;
  updatedItems: number;
  categoriesCreated: number;
  format: string;
}

export interface ImportJobDto {
  id: string;
  feedSourceId: string;
  userId?: string;
  status: string;
  totalItems: number;
  processedItems: number;
  createdItems: number;
  updatedItems: number;
  failedItems: number;
  progressPercent: number;
  selectedCategories?: string[] | null;
  errorLogs?: unknown;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  feedSource?: {
    name: string;
    sourceType: string;
    sourceUrl?: string;
  };
}

export interface FeedSourceItemDto {
  id: string;
  supplierId: string;
  name: string;
  sourceType: string;
  fileFormat: string;
  sourceUrl?: string;
  s3FileKey?: string;
  autoUpdatePrices: boolean;
  autoUpdateStocks: boolean;
  lastSyncedAt?: string | null;
  lastSyncStatus?: string | null;
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export async function analyzeFeedUrl(
  url: string,
  supplierId?: string,
  token?: string,
): Promise<FeedAnalysisResult> {
  if (isTauri()) {
    const res = await localDb.feeds.analyzeFeed(url);
    return {
      format: res.format,
      totalDetected: res.totalProducts,
      categoriesCount: res.categories.length,
      categories: res.categories.map((c) => ({
        id: c.id,
        externalId: c.id,
        name: c.name,
        productCount: c.productCount,
      })),
      sampleCategories: res.categories.map((c) => ({ externalId: c.id, name: c.name })),
      sampleProducts: [],
      url,
    };
  }

  try {
    const response = await fetchWithAuth(
      '/feeds/analyze-url',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, supplierId }),
      },
      token,
    );
    if (response.ok) {
      return (await response.json()) as FeedAnalysisResult;
    }
  } catch {}

  const res = await localDb.feeds.analyzeFeed(url, supplierId);
  return {
    format: res.format,
    totalDetected: res.totalProducts,
    categoriesCount: res.categories.length,
    categories: res.categories.map((c) => ({
      id: c.id,
      externalId: c.id,
      name: c.name,
      productCount: c.productCount,
    })),
    sampleCategories: res.sampleCategories || [],
    sampleProducts: (res.sampleProducts || []).map((p: any) => ({
      sku: p.sku,
      titleUk: p.titleUk,
      costPrice: p.costPrice,
      price: p.price,
      currency: p.currency || 'UAH',
      stockQuantity: p.stockQuantity,
      inStock: p.inStock,
      categoryName: p.categoryName,
      images: (p.images || []).map((img: string) => ({ originalUrl: img, isMain: true })),
    })),
    url,
  };
}

export async function analyzeFeedContent(
  content: string,
  supplierId?: string,
  token?: string,
): Promise<FeedAnalysisResult> {
  if (isTauri()) {
    const res = await localDb.feeds.analyzeFeed(content);
    return {
      format: res.format,
      totalDetected: res.totalProducts,
      categoriesCount: res.categories.length,
      categories: res.categories.map((c) => ({
        id: c.id,
        externalId: c.id,
        name: c.name,
        productCount: c.productCount,
      })),
      sampleCategories: res.categories.map((c) => ({ externalId: c.id, name: c.name })),
      sampleProducts: [],
    };
  }

  try {
    const response = await fetchWithAuth(
      '/feeds/analyze',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, supplierId }),
      },
      token,
    );
    if (response.ok) {
      return (await response.json()) as FeedAnalysisResult;
    }
  } catch {}

  const res = await localDb.feeds.analyzeFeed(content, supplierId);
  return {
    format: res.format,
    totalDetected: res.totalProducts,
    categoriesCount: res.categories.length,
    categories: res.categories.map((c) => ({
      id: c.id,
      externalId: c.id,
      name: c.name,
      productCount: c.productCount,
    })),
    sampleCategories: res.sampleCategories || [],
    sampleProducts: (res.sampleProducts || []).map((p: any) => ({
      sku: p.sku,
      titleUk: p.titleUk,
      costPrice: p.costPrice,
      price: p.price,
      currency: p.currency || 'UAH',
      stockQuantity: p.stockQuantity,
      inStock: p.inStock,
      categoryName: p.categoryName,
      images: (p.images || []).map((img: string) => ({ originalUrl: img, isMain: true })),
    })),
  };
}

export async function importFeedAsync(
  dto: {
    supplierId: string;
    sourceType: 'URL' | 'FILE';
    sourceUrl?: string;
    fileContent?: string;
    fileName?: string;
    catalogId?: string;
    selectedCategoryIds?: string[];
    autoUpdatePrices?: boolean;
    autoUpdateStocks?: boolean;
  },
  token?: string,
): Promise<{ success: boolean; jobId: string; feedSourceId: string; status: string }> {
  let feedSourceId = `feed_${dto.supplierId}_${Date.now().toString(36)}`;
  try {
    const importRes = await localDb.feeds.importFeedContent(dto.fileContent || '', {
      supplierId: dto.supplierId,
      selectedCategoryIds: dto.selectedCategoryIds,
      sourceUrl: dto.sourceUrl,
      fileName: dto.fileName,
      sourceType: dto.sourceType as any,
    });
    feedSourceId = importRes.feedSourceId;
  } catch {}

  if (isTauri()) {
    return {
      success: true,
      jobId: `job_${Date.now()}`,
      feedSourceId,
      status: 'COMPLETED',
    };
  }

  try {
    const response = await fetchWithAuth(
      '/feeds/import-async',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      },
      token,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch {}

  return {
    success: true,
    jobId: `job_${Date.now()}`,
    feedSourceId,
    status: 'COMPLETED',
  };
}

export async function getImportJobStatus(jobId: string, token?: string): Promise<ImportJobDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(`/feeds/jobs/${jobId}`, { method: 'GET' }, token);
      if (response.ok) {
        return (await response.json()) as ImportJobDto;
      }
    } catch {}
  }

  return {
    id: jobId,
    feedSourceId: 'feed_mock_01',
    status: 'COMPLETED',
    totalItems: 450,
    processedItems: 450,
    createdItems: 450,
    updatedItems: 0,
    failedItems: 0,
    progressPercent: 100,
    createdAt: new Date().toISOString(),
  };
}

export async function getActiveImportJobs(token?: string): Promise<ImportJobDto[]> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth('/feeds/jobs/active', { method: 'GET' }, token);
      if (response.ok) {
        return (await response.json()) as ImportJobDto[];
      }
    } catch {}
  }
  return [];
}

export async function getSupplierFeedSources(
  supplierId: string,
  token?: string,
): Promise<FeedSourceItemDto[]> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/feeds/suppliers/${supplierId}/sources`,
        { method: 'GET' },
        token,
      );
      if (response.ok) {
        return (await response.json()) as FeedSourceItemDto[];
      }
    } catch {}
  }

  const sources = await localDb.feeds.getSupplierFeedSources(supplierId);
  return sources.map((s) => ({
    id: s.id,
    supplierId: s.supplierId,
    name: s.name,
    sourceType: s.sourceType,
    fileFormat: s.fileFormat || 'XML',
    sourceUrl: s.sourceUrl || undefined,
    autoUpdatePrices: s.autoUpdatePrices ?? true,
    autoUpdateStocks: s.autoUpdateStocks ?? true,
    lastSyncedAt: s.lastSyncedAt
      ? typeof s.lastSyncedAt === 'string'
        ? s.lastSyncedAt
        : s.lastSyncedAt.toISOString()
      : null,
    lastSyncStatus: s.lastSyncStatus || 'SUCCESS',
    productsCount: s.productsCount ?? 0,
    createdAt: typeof s.createdAt === 'string' ? s.createdAt : s.createdAt.toISOString(),
    updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : s.updatedAt.toISOString(),
  }));
}

export async function getAllFeedSources(token?: string): Promise<FeedSourceItemDto[]> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth('/feeds/sources', { method: 'GET' }, token);
      if (response.ok) {
        return (await response.json()) as FeedSourceItemDto[];
      }
    } catch {}
  }

  const sources = await localDb.feeds.getAllFeedSources();
  return sources.map((s) => ({
    id: s.id,
    supplierId: s.supplierId,
    name: s.name,
    sourceType: s.sourceType,
    fileFormat: s.fileFormat || 'XML',
    sourceUrl: s.sourceUrl || undefined,
    autoUpdatePrices: s.autoUpdatePrices ?? true,
    autoUpdateStocks: s.autoUpdateStocks ?? true,
    lastSyncedAt: s.lastSyncedAt
      ? typeof s.lastSyncedAt === 'string'
        ? s.lastSyncedAt
        : s.lastSyncedAt.toISOString()
      : null,
    lastSyncStatus: s.lastSyncStatus || 'SUCCESS',
    productsCount: s.productsCount ?? 0,
    createdAt: typeof s.createdAt === 'string' ? s.createdAt : s.createdAt.toISOString(),
    updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : s.updatedAt.toISOString(),
  }));
}

export async function syncSupplierFeedSource(
  supplierId: string,
  sourceId: string,
  token?: string,
): Promise<{ success: boolean; jobId: string }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/feeds/suppliers/${supplierId}/sources/${sourceId}/sync`,
        { method: 'POST' },
        token,
      );
      if (response.ok) {
        return await response.json();
      }
    } catch {}
  }
  return { success: true, jobId: `job_${Date.now()}` };
}

export async function deleteSupplierFeedSource(
  supplierId: string,
  sourceId: string,
  token?: string,
  deleteProducts = true,
): Promise<{ success: boolean; deletedProductsCount?: number }> {
  if (!isTauri()) {
    try {
      const query = deleteProducts ? '?deleteProducts=true' : '';
      const response = await fetchWithAuth(
        `/feeds/suppliers/${supplierId}/sources/${sourceId}${query}`,
        { method: 'DELETE' },
        token,
      );
      if (response.ok) {
        return await response.json();
      }
    } catch {}
  }
  await localDb.feeds.deleteSupplierFeedSource(supplierId, sourceId);
  return { success: true };
}

export async function bulkDeleteProducts(
  token: string,
  dto: BulkDeleteProductsDto,
): Promise<BulkDeleteResultDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/products/bulk-delete',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as BulkDeleteResultDto;
      }
    } catch {}
  }

  return localDb.products.bulkDeleteProducts(dto);
}

export async function getCategoriesSummary(token?: string): Promise<ProductCategorySummaryDto[]> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/products/categories-summary',
        { method: 'GET' },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ProductCategorySummaryDto[];
      }
    } catch {}
  }
  return localDb.products.getCategoriesSummary();
}

export async function importFeedUrl(
  dto: { supplierId: string; url: string; catalogId?: string },
  token?: string,
): Promise<ImportFeedResultDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/feeds/import-url',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ImportFeedResultDto;
      }
    } catch {}
  }

  return {
    feedSourceId: `feed_${dto.supplierId}_01`,
    totalItems: 450,
    createdItems: 450,
    updatedItems: 0,
    categoriesCreated: 4,
    format: 'XML',
  };
}

export async function importFeedContent(
  dto: { supplierId: string; content: string; fileName?: string; catalogId?: string },
  token?: string,
): Promise<ImportFeedResultDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/feeds/import-content',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ImportFeedResultDto;
      }
    } catch {}
  }

  return {
    feedSourceId: `feed_${dto.supplierId}_01`,
    totalItems: 450,
    createdItems: 450,
    updatedItems: 0,
    categoriesCreated: 4,
    format: 'XML',
  };
}

// ---------------------------------------------------------------------------
// Supplier Multi-Tier Pricing Rules API (Local-First via localDb)
// ---------------------------------------------------------------------------

export async function getSupplierPricingRules(
  supplierId: string,
  token?: string,
): Promise<SupplierPricingRuleDto[]> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules`,
        { method: 'GET' },
        token,
      );
      if (response.ok) {
        return (await response.json()) as SupplierPricingRuleDto[];
      }
    } catch {}
  }

  return localDb.pricing.getPricingRules(supplierId);
}

export async function createSupplierPricingRule(
  supplierId: string,
  dto: CreateSupplierPricingRuleDto,
  token?: string,
): Promise<SupplierPricingRuleDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as SupplierPricingRuleDto;
      }
    } catch {}
  }

  return localDb.pricing.createPricingRule(supplierId, dto);
}

export async function updateSupplierPricingRule(
  supplierId: string,
  ruleId: string,
  dto: UpdateSupplierPricingRuleDto,
  token?: string,
): Promise<SupplierPricingRuleDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules/${ruleId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as SupplierPricingRuleDto;
      }
    } catch {}
  }

  return localDb.pricing.updatePricingRule(supplierId, ruleId, dto);
}

export async function deleteSupplierPricingRule(
  supplierId: string,
  ruleId: string,
  token?: string,
): Promise<{ success: boolean }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/suppliers/${supplierId}/pricing-rules/${ruleId}`,
        { method: 'DELETE' },
        token,
      );
      if (response.ok) {
        return { success: true };
      }
    } catch {}
  }

  const success = await localDb.pricing.deletePricingRule(supplierId, ruleId);
  return { success };
}

// ---------------------------------------------------------------------------
// Export Channels & Marketplace Feeds API (Local-First via localDb)
// ---------------------------------------------------------------------------

export async function getExportChannels(
  params?: { search?: string; isActive?: boolean },
  token?: string,
): Promise<ExportChannelDto[]> {
  if (!isTauri()) {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
      const url = `/export/channels${query.toString() ? `?${query.toString()}` : ''}`;
      const response = await fetchWithAuth(url, { method: 'GET' }, token);
      if (response.ok) {
        return (await response.json()) as ExportChannelDto[];
      }
    } catch {}
  }

  return localDb.export.getExportChannels();
}

export async function getExportChannelById(
  id: string,
  token?: string,
): Promise<ExportChannelDto & { pricingRules: ExportChannelPricingRuleDto[] }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(`/export/channels/${id}`, { method: 'GET' }, token);
      if (response.ok) {
        return await response.json();
      }
    } catch {}
  }

  const channel = await localDb.export.getExportChannelById(id);
  if (!channel) {
    throw new ApiError('Канал експорту не знайдено', 404);
  }
  const pricingRules = await localDb.export.getExportPricingRules(id);
  return {
    ...channel,
    pricingRules,
  };
}

export async function createExportChannel(
  dto: CreateExportChannelDto,
  token?: string,
): Promise<ExportChannelDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        '/export/channels',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ExportChannelDto;
      }
    } catch {}
  }

  return localDb.export.createExportChannel(dto);
}

export async function updateExportChannel(
  id: string,
  dto: UpdateExportChannelDto,
  token?: string,
): Promise<ExportChannelDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/export/channels/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ExportChannelDto;
      }
    } catch {}
  }

  return localDb.export.updateExportChannel(id, dto);
}

export async function deleteExportChannel(
  id: string,
  token?: string,
): Promise<{ success: boolean }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(`/export/channels/${id}`, { method: 'DELETE' }, token);
      if (response.ok) {
        return { success: true };
      }
    } catch {}
  }

  const success = await localDb.export.deleteExportChannel(id);
  return { success };
}

export async function createExportChannelRule(
  channelId: string,
  dto: CreateExportChannelPricingRuleDto,
  token?: string,
): Promise<ExportChannelPricingRuleDto> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/export/channels/${channelId}/rules`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto),
        },
        token,
      );
      if (response.ok) {
        return (await response.json()) as ExportChannelPricingRuleDto;
      }
    } catch {}
  }

  return localDb.export.createExportPricingRule(channelId, dto);
}

export async function deleteExportChannelRule(
  channelId: string,
  ruleId: string,
  token?: string,
): Promise<{ success: boolean }> {
  if (!isTauri()) {
    try {
      const response = await fetchWithAuth(
        `/export/channels/${channelId}/rules/${ruleId}`,
        { method: 'DELETE' },
        token,
      );
      if (response.ok) {
        return { success: true };
      }
    } catch {}
  }

  const success = await localDb.export.deleteExportPricingRule(channelId, ruleId);
  return { success };
}

export async function simulatePricing(
  dto: PriceSimulationRequestDto,
): Promise<PriceSimulationResultDto> {
  return localDb.export.simulatePrice(dto);
}
