import { test, expect } from '@e2e/fixtures/test';

test.describe('Admin Portal — Налаштування та Профіль (POM E2E)', () => {
  test('відображення налаштувань платформи та теми', async ({ settingsPage }) => {
    await settingsPage.goto();

    // 1. Заголовок
    await expect(settingsPage.headerTitle).toHaveText('Налаштування платформи');

    // 2. Налаштування теми
    await expect(settingsPage.darkModeBtn).toBeVisible();
    await expect(settingsPage.lightModeBtn).toBeVisible();
  });

  test('відображення профілю адміністратора та валідація зміни пароля', async ({
    settingsPage,
  }) => {
    await settingsPage.gotoProfile();

    // 1. Заголовок
    await expect(settingsPage.profileHeaderTitle).toHaveText('Профіль адміністратора');

    // 2. Картка профілю
    await expect(settingsPage.profileCard).toBeVisible();
    await expect(settingsPage.profileName).toContainText('Super Admin');
    await expect(settingsPage.profileEmail).toContainText('admin@smartfeed.studio');
    await expect(settingsPage.profileRole).toContainText('Адміністратор');

    // 3. Спроба ввести новий пароль коротший за 8 символів
    await settingsPage.submitChangePassword('old_pass_123', 'short', 'short');
    await expect(settingsPage.passwordError).toBeVisible();
    await expect(settingsPage.passwordError).toHaveText(
      'Новий пароль повинен містити не менше 8 символів',
    );

    // 4. Спроба ввести невідповідні паролі
    await settingsPage.submitChangePassword('old_pass_123', 'ValidPass123!', 'DifferentPass123!');
    await expect(settingsPage.passwordError).toBeVisible();
    await expect(settingsPage.passwordError).toHaveText(
      'Новий пароль та підтвердження не співпадають',
    );
  });

  test('динамічне перемикання мови UA ⇄ EN на сторінці налаштувань', async ({ settingsPage }) => {
    await settingsPage.goto();

    // 1. Початковий стан: Українська
    await expect(settingsPage.headerTitle).toHaveText('Налаштування платформи');
    await expect(settingsPage.darkModeBtn).toContainText('Темна');

    // 2. Перемикаємо на Англійську
    await settingsPage.toggleLanguage();

    // 3. Перевірка англійських текстів
    await expect(settingsPage.headerTitle).toHaveText('Platform Settings');
    await expect(settingsPage.darkModeBtn).toContainText('Dark');

    // 4. Повернення на Українську
    await settingsPage.toggleLanguage();
    await expect(settingsPage.headerTitle).toHaveText('Налаштування платформи');
    await expect(settingsPage.darkModeBtn).toContainText('Темна');
  });
});
