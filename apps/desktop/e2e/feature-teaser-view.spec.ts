import { test, expect } from '@playwright/test';
import {
  mockSoloStarterUser,
  mockStarterLicense,
  setupFeatureTeaserMocks,
} from '@e2e/fixtures/feature-teaser-mock-data';

test.describe('Desktop App — Feature Teaser Presentation & Bypass (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await setupFeatureTeaserMocks(page, 'uk');
  });

  test('1. Сайдбар: Starter користувач бачить Команду в окремому блоці «Розширити можливості» із бейджем та замочком', async ({
    page,
  }) => {
    await page.goto('/');

    const sidebar = page.locator('[data-testid="desktop-sidebar"]');
    await expect(sidebar).toBeVisible();

    const upsellSection = page.locator('[data-testid="sidebar-upsell-section"]');
    await expect(upsellSection).toBeVisible();
    await expect(upsellSection).toContainText('Розширити можливості');

    const teamUpsellItem = upsellSection.locator('[data-testid="nav-item-team"]');
    await expect(teamUpsellItem).toBeVisible();
    await expect(teamUpsellItem).toContainText('Команда');
    await expect(teamUpsellItem).toContainText('PRO');
  });

  test('2. Клік по Команді відкриває інтерактивну презентацію FeatureTeaserView замість 403 чи реальної сторінки', async ({
    page,
  }) => {
    await page.goto('/team');

    await expect(page.locator('[data-testid="feature-teaser-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-page"]')).not.toBeVisible();

    await expect(page.locator('[data-testid="feature-hero-title"]')).toHaveText(
      'Масштабуйте бізнес разом із командою',
    );
    await expect(page.locator('[data-testid="feature-hero-plan-badge"]')).toContainText(
      'PRO ТАРИФ',
    );
    await expect(page.locator('[data-testid="feature-hero-interactive-badge"]')).toContainText(
      'Інтерактивний макет',
    );

    const benefitsGrid = page.locator('[data-testid="feature-benefits-grid"]');
    await expect(benefitsGrid).toBeVisible();
    await expect(page.locator('[data-testid="benefit-card-seats"]')).toContainText(
      'До 5 робочих місць',
    );
    await expect(page.locator('[data-testid="benefit-card-roles"]')).toContainText(
      'Гранулярний контроль ролей',
    );
  });

  test('3. Порівняльна таблиця та липкий 100% Solid Sticky CTA блок', async ({ page }) => {
    await page.goto('/team');

    const comparisonCard = page.locator('[data-testid="feature-comparison-card"]');
    await expect(comparisonCard).toBeVisible();
    await expect(comparisonCard).toContainText('Ваш поточний тариф (Старт)');
    await expect(comparisonCard).toContainText('Тариф PRO');

    const stickyBar = page.locator('[data-testid="feature-sticky-cta-bar"]');
    await expect(stickyBar).toBeVisible();
    await expect(page.locator('[data-testid="cta-price-tag"]')).toContainText(
      'від 799 грн / місяць',
    );

    await page.locator('[data-testid="cta-upgrade-primary-btn"]').click();
    await expect(page).toHaveURL(/.*\/plans\?highlight=PRO/);
  });

  test('4. Двомовність (i18n): 100% динамічний переклад при зміні мови UA ⇄ EN', async ({
    page,
  }) => {
    await setupFeatureTeaserMocks(page, 'en');
    await page.goto('/team');

    const upsellSection = page.locator('[data-testid="sidebar-upsell-section"]');
    await expect(upsellSection).toContainText('Expand Capabilities');

    await expect(page.locator('[data-testid="feature-hero-title"]')).toHaveText(
      'Scale Your Business With Your Team',
    );
    await expect(page.locator('[data-testid="feature-hero-plan-badge"]')).toContainText('PRO PLAN');
    await expect(page.locator('[data-testid="feature-hero-interactive-badge"]')).toContainText(
      'Interactive Mockup',
    );

    await expect(page.locator('[data-testid="feature-benefits-title"]')).toHaveText(
      'Why businesses upgrade to the Team plan?',
    );

    await expect(page.locator('[data-testid="mockup-invite-btn"]')).toHaveText('+ Invite Member');

    await expect(page.locator('[data-testid="cta-price-tag"]')).toContainText(
      'from 799 UAH / month',
    );
    await expect(page.locator('[data-testid="cta-upgrade-primary-btn"]')).toContainText(
      'Upgrade to PRO',
    );
  });

  test('5. Користувач із PRO тарифом: одразу отримує робочу сторінку команди без тизера', async ({
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

    await page.route(/\/api\/organizations\/org-pro-1\/invitations/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
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

    await expect(page.locator('[data-testid="team-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="feature-teaser-page"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="company-title"]')).toHaveText('Pro Corporation');
  });
});
