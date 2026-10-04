import { Page } from '@playwright/test';

export const mockSoloStarterUser = {
  id: 'usr-solo-starter',
  email: 'solo@smartfeed.studio',
  fullName: 'Solo Store Owner',
  role: 'USER',
  organization: null,
};

export const mockStarterLicense = {
  id: 'lic-solo-1',
  userId: mockSoloStarterUser.id,
  organizationId: null,
  organizationName: null,
  licenseKey: 'SF-SOLO-STARTER-1234',
  planType: 'STARTER',
  canCloudBackup: false,
  maxXmlLimit: 1000,
  maxTeamSeats: 1,
  aiCredits: 50,
  isActive: true,
  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  isExpired: false,
  daysRemaining: 14,
};

export async function setupFeatureTeaserMocks(page: Page, lang = 'uk') {
  await page.addInitScript(
    ({ user, language }) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock-solo-token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', language);
    },
    { user: mockSoloStarterUser, language: lang },
  );

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSoloStarterUser),
    });
  });

  await page.route('**/api/licenses/my', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStarterLicense),
    });
  });

  await page.route(/\/api\/organizations$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route('**/api/navigation?app=DESKTOP', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'item-1',
          key: 'dashboard',
          labelUk: 'Дашборд',
          labelEn: 'Dashboard',
          path: '/',
          icon: 'LayoutDashboard',
          order: 1,
          isVisible: true,
          requiredRoles: ['USER'],
          requiredPlan: null,
        },
        {
          id: 'item-2',
          key: 'catalogs',
          labelUk: 'Каталоги товарів',
          labelEn: 'Product Catalogs',
          path: '/catalogs',
          icon: 'Layers',
          order: 2,
          isVisible: true,
          requiredRoles: ['USER'],
          requiredPlan: null,
        },
        {
          id: 'item-3',
          key: 'plans',
          labelUk: 'Тарифи',
          labelEn: 'Plans & Pricing',
          path: '/plans',
          icon: 'CreditCard',
          order: 3,
          isVisible: true,
          requiredRoles: ['USER'],
          requiredPlan: null,
        },
        {
          id: 'item-4',
          key: 'team',
          labelUk: 'Команда',
          labelEn: 'Team',
          path: '/team',
          icon: 'Users',
          order: 4,
          isVisible: true,
          requiredRoles: ['USER'],
          requiredPlan: 'PRO',
        },
      ]),
    });
  });
}
