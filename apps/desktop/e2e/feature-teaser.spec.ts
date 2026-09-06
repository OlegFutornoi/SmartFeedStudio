import { test, expect } from '@playwright/test';

test.describe('Desktop App — Модуль Feature Gate & Upsell Teaser (In-App PLG & Showcase)', () => {
  // Solo user on Starter plan without any organization
  const mockSoloStarterUser = {
    id: 'usr-solo-starter',
    email: 'solo@smartfeed.studio',
    fullName: 'Solo Store Owner',
    role: 'USER',
    organization: null,
  };

  const mockStarterLicense = {
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

  test.beforeEach(async ({ page }) => {
    // 100% test isolation & proper auth session
    await page.addInitScript((user) => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('smartfeed_access_token', 'mock-solo-token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
    }, mockSoloStarterUser);

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
  });

  test('1. Сайдбар: Starter користувач бачить Команду в окремому блоці «Можливості PRO» із бейджем та замочком', async ({
    page,
  }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    await expect(sidebar).toBeVisible();

    // Перевіряємо наявність секції upsell
    const upsellSection = page.locator('[data-testid="sidebar-upsell-section"]');
    await expect(upsellSection).toBeVisible();
    await expect(upsellSection).toContainText('Можливості PRO');

    // Перевіряємо пункт Команда в блоці upsell
    const teamUpsellItem = upsellSection.locator('[data-testid="nav-item-team"]');
    await expect(teamUpsellItem).toBeVisible();
    await expect(teamUpsellItem).toContainText('Команда');
    await expect(teamUpsellItem).toContainText('PRO');
  });

  test('2. Клік по Команді відкриває інтерактивну презентацію FeatureTeaserView замість 403 чи реальної сторінки', async ({
    page,
  }) => {
    await page.goto('/team');

    // Сторінка тизера видима, реальна сторінка команди заблокована
    await expect(page.locator('[data-testid="feature-teaser-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-page"]')).not.toBeVisible();

    // Перевіряємо Hero блок
    await expect(page.locator('[data-testid="feature-hero-title"]')).toHaveText(
      'Масштабуйте бізнес разом із командою',
    );
    await expect(page.locator('[data-testid="feature-hero-plan-badge"]')).toContainText(
      'PRO ТАРИФ',
    );
    await expect(page.locator('[data-testid="feature-hero-interactive-badge"]')).toContainText(
      'Інтерактивний макет',
    );

    // Перевіряємо сітку переваг
    const benefitsGrid = page.locator('[data-testid="feature-benefits-grid"]');
    await expect(benefitsGrid).toBeVisible();
    await expect(page.locator('[data-testid="benefit-card-seats"]')).toContainText(
      'До 5 робочих місць',
    );
    await expect(page.locator('[data-testid="benefit-card-roles"]')).toContainText(
      'Гранулярний контроль ролей',
    );
  });

  test('3. Інтерактивна пісочниця (Mockup): перемикання ролей співробітника та модалка апгрейду', async ({
    page,
  }) => {
    await page.goto('/team');
    await expect(page.locator('[data-testid="interactive-team-mockup"]')).toBeVisible();

    // За замовчуванням Марія — Адміністратор
    const interactiveRow = page.locator('[data-testid="mockup-interactive-row"]');
    await expect(interactiveRow).toContainText('Адміністратор');

    // Клікаємо на кнопку Менеджер
    await page.locator('[data-testid="mockup-select-member"]').click();
    await expect(interactiveRow).toContainText('Менеджер');

    // Повертаємо на Адміністратор
    await page.locator('[data-testid="mockup-select-admin"]').click();
    await expect(interactiveRow).toContainText('Адміністратор');

    // Клікаємо на кнопку "+ Запросити учасника"
    await page.locator('[data-testid="mockup-invite-btn"]').click();

    // З'являється модальне вікно оновлення тарифу
    const upgradeDialog = page.locator('[data-testid="mockup-upgrade-dialog"]');
    await expect(upgradeDialog).toBeVisible();
    await expect(upgradeDialog).toContainText('Потрібен тариф PRO');

    // Клік на кнопку апгрейду перенаправляє на /plans
    await page.locator('[data-testid="mockup-confirm-upgrade-btn"]').click();
    await expect(page).toHaveURL(/.*\/plans\?highlight=PRO/);
  });

  test('4. Інтерактивний калькулятор ROI: зміна годин динамічно оновлює заощаджений час та суму', async ({
    page,
  }) => {
    await page.goto('/team');
    const roiWidget = page.locator('[data-testid="feature-roi-widget"]');
    await expect(roiWidget).toBeVisible();

    // Початкове значення: 10 год/тиждень
    const slider = page.locator('[data-testid="roi-hours-slider"]');
    await expect(slider).toBeVisible();

    // Змінюємо повзунок на 20 годин
    await slider.fill('20');
    await expect(page.locator('[data-testid="roi-slider-value"]')).toHaveText('20 год/тиждень');

    // Розрахунок: 20 * 4 * 0.8 = ~64 год/міс, 64 * 200 = ~12,800 грн/міс
    await expect(page.locator('[data-testid="roi-hours-saved-result"]')).toContainText(
      '64 год/міс',
    );
    await expect(page.locator('[data-testid="roi-money-saved-result"]')).toContainText(
      '12,800 грн/міс',
    );
  });

  test('5. Порівняльна таблиця та липкий 100% Solid Sticky CTA блок', async ({ page }) => {
    await page.goto('/team');

    // Картка порівняння
    const comparisonCard = page.locator('[data-testid="feature-comparison-card"]');
    await expect(comparisonCard).toBeVisible();
    await expect(comparisonCard).toContainText('Ваш поточний тариф (Старт)');
    await expect(comparisonCard).toContainText('Тариф PRO');

    // Sticky CTA блок
    const stickyBar = page.locator('[data-testid="feature-sticky-cta-bar"]');
    await expect(stickyBar).toBeVisible();
    await expect(page.locator('[data-testid="cta-price-tag"]')).toContainText(
      'від 799 грн / місяць',
    );

    // Клік на кнопку оновлення веде на тарифи з виділеним PRO
    await page.locator('[data-testid="cta-upgrade-primary-btn"]').click();
    await expect(page).toHaveURL(/.*\/plans\?highlight=PRO/);
  });

  test('6. Двомовність (i18n): 100% динамічний переклад при зміні мови UA ⇄ EN', async ({
    page,
  }) => {
    // Встановлюємо англійську мову
    await page.addInitScript((user) => {
      window.localStorage.setItem('smartfeed_access_token', 'mock-solo-token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'en');
    }, mockSoloStarterUser);

    await page.goto('/team');

    // Сайдбар англійською
    const upsellSection = page.locator('[data-testid="sidebar-upsell-section"]');
    await expect(upsellSection).toContainText('PRO Capabilities');

    // Заголовок англійською
    await expect(page.locator('[data-testid="feature-hero-title"]')).toHaveText(
      'Scale Your Business With Your Team',
    );
    await expect(page.locator('[data-testid="feature-hero-plan-badge"]')).toContainText('PRO PLAN');
    await expect(page.locator('[data-testid="feature-hero-interactive-badge"]')).toContainText(
      'Interactive Mockup',
    );

    // Переваги англійською
    await expect(page.locator('[data-testid="feature-benefits-title"]')).toHaveText(
      'Why businesses upgrade to the Team plan?',
    );

    // Мокап англійською
    await expect(page.locator('[data-testid="mockup-invite-btn"]')).toHaveText('+ Invite Member');

    // CTA англійською
    await expect(page.locator('[data-testid="cta-price-tag"]')).toContainText(
      'from 799 UAH / month',
    );
    await expect(page.locator('[data-testid="cta-upgrade-primary-btn"]')).toContainText(
      'Upgrade to PRO',
    );
  });

  test('7. Користувач із PRO тарифом: одразу отримує робочу сторінку команди без тизера', async ({
    page,
  }) => {
    const mockProUser = {
      ...mockSoloStarterUser,
      organization: {
        id: 'org-pro-1',
        name: 'Pro Corporation',
        role: 'OWNER',
      },
    };

    const mockProLicense = {
      ...mockStarterLicense,
      planType: 'PRO',
      maxTeamSeats: 5,
    };

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProUser),
      });
    });

    await page.route('**/api/licenses/my', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProLicense),
      });
    });

    await page.route(/\/api\/organizations$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'org-pro-1',
            name: 'Pro Corporation',
            ownerId: mockProUser.id,
            activePlan: 'PRO',
            maxTeamSeats: 5,
            usedTeamSeats: 1,
            currentUserRole: 'OWNER',
            members: [
              {
                id: 'mem-1',
                userId: mockProUser.id,
                email: mockProUser.email,
                role: 'OWNER',
              },
            ],
          },
        ]),
      });
    });

    await page.route(/\/api\/organizations\/org-pro-1$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'org-pro-1',
          name: 'Pro Corporation',
          ownerId: mockProUser.id,
          activePlan: 'PRO',
          maxTeamSeats: 5,
          usedTeamSeats: 1,
          currentUserRole: 'OWNER',
          members: [
            {
              id: 'mem-1',
              userId: mockProUser.id,
              email: mockProUser.email,
              role: 'OWNER',
            },
          ],
        }),
      });
    });

    await page.addInitScript((user) => {
      window.localStorage.setItem('smartfeed_access_token', 'mock-pro-token');
      window.localStorage.setItem('smartfeed_user_profile', JSON.stringify(user));
      window.localStorage.setItem('smartfeed_language', 'uk');
    }, mockProUser);

    await page.goto('/team');

    // Реальна сторінка команди відкрита, тизер не відображається
    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="feature-teaser-page"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="company-title"]')).toHaveText('Pro Corporation');
  });

  test('8. AI Асистент: відображається в блоці «Можливості PRO» та відкриває інтерактивний AI Sandbox з підтримкою UA ⇄ EN', async ({
    page,
  }) => {
    await page.goto('/catalogs');

    // Перевірка наявності AI Асистента у блоці Можливості PRO
    const upsellSection = page.locator('[data-testid="sidebar-upsell-section"]');
    await expect(upsellSection).toBeVisible();

    const aiItem = upsellSection.locator('[data-testid="nav-item-ai_enrichment"]');
    await expect(aiItem).toBeVisible();
    await expect(aiItem).toContainText('AI Асистент');
    await expect(aiItem).toContainText('GROWTH');

    // Клік відкриває тизер /ai-enrichment
    await aiItem.click();
    await expect(page).toHaveURL(/.*\/ai-enrichment/);
    await expect(page.locator('[data-testid="feature-teaser-page"]')).toBeVisible();

    // Перевірка Hero заголовка та бейджа AI
    await expect(page.locator('[data-testid="feature-hero-plan-badge"]')).toContainText(
      'AI & GROWTH',
    );
    await expect(page.locator('[data-testid="feature-hero-title"]')).toContainText(
      'Розумний AI Асистент',
    );

    // Перевірка наявності інтерактивного AI Sandbox
    const aiMockup = page.locator('[data-testid="ai-interactive-mockup"]');
    await expect(aiMockup).toBeVisible();

    // Двомовна перевірка UA ⇄ EN
    const langBtn = page.locator('[data-testid="language-toggle-btn"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await expect(aiItem).toContainText('AI Assistant');
      await expect(page.locator('[data-testid="feature-hero-title"]')).toContainText(
        'Intelligent AI Assistant',
      );
      // Повертаємо назад на українську
      await langBtn.click();
      await expect(aiItem).toContainText('AI Асистент');
    }

    // Клік на "+ Пакетна генерація" відкриває модалку апгрейду
    await page.locator('[data-testid="ai-batch-generate-btn"]').click();
    await expect(page.locator('[data-testid="ai-upgrade-dialog"]')).toBeVisible();
  });
});
