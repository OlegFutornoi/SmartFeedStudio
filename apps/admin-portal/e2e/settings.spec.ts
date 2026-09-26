import { test, expect } from './fixtures/test';

test.describe('Admin Portal — Налаштування, Профіль та Валідація (POM E2E)', () => {
  test('відображення профілю адміністратора та карток інфраструктури', async ({ settingsPage }) => {
    await settingsPage.goto();

    // 1. Заголовок
    await expect(settingsPage.headerTitle).toHaveText('Налаштування акаунту та безпеки');

    // 2. Картка профілю
    await expect(settingsPage.profileCard).toBeVisible();
    await expect(settingsPage.profileName).toContainText('Super Admin');
    await expect(settingsPage.profileEmail).toContainText('admin@smartfeed.studio');
    await expect(settingsPage.profileRole).toContainText('Власник');

    // 3. Інфраструктура
    await expect(settingsPage.infraCard).toBeVisible();
    await expect(settingsPage.infraBadgePostgres).toHaveText('Підключено');
    await expect(settingsPage.infraBadgeRedis).toHaveText('Підключено');
    await expect(settingsPage.infraBadgeS3).toHaveText('Підключено');
  });

  test('валідація форми зміни пароля (короткий пароль та невідповідність)', async ({
    settingsPage,
  }) => {
    await settingsPage.goto();

    // 1. Спроба ввести новий пароль коротший за 8 символів
    await settingsPage.submitChangePassword('old_pass_123', 'short', 'short');
    await expect(settingsPage.passwordError).toBeVisible();
    await expect(settingsPage.passwordError).toHaveText(
      'Новий пароль повинен містити не менше 8 символів',
    );

    // 2. Спроба ввести невідповідні паролі
    await settingsPage.submitChangePassword('old_pass_123', 'ValidPass123!', 'DifferentPass123!');
    await expect(settingsPage.passwordError).toBeVisible();
    await expect(settingsPage.passwordError).toHaveText(
      'Новий пароль та підтвердження не співпадають',
    );
  });

  test('динамічне перемикання мови UA ⇄ EN та перевірка перекладу всіх карток налаштувань', async ({
    settingsPage,
  }) => {
    await settingsPage.goto();

    // 1. Початковий стан: Українська
    await expect(settingsPage.headerTitle).toHaveText('Налаштування акаунту та безпеки');
    await expect(settingsPage.infraBadgePostgres).toHaveText('Підключено');

    // 2. Перемикаємо на Англійську
    await settingsPage.toggleLanguage();

    // 3. Перевірка англійських текстів
    await expect(settingsPage.headerTitle).toHaveText('Account & Security Settings');
    await expect(settingsPage.headerSubtitle).toHaveText(
      'Manage administrator profile, password, color theme, and system parameters',
    );
    await expect(settingsPage.infraBadgePostgres).toHaveText('Connected');
    await expect(settingsPage.infraBadgeRedis).toHaveText('Connected');
    await expect(settingsPage.infraBadgeS3).toHaveText('Connected');

    // Перевірка валідації пароля англійською мовою
    await settingsPage.submitChangePassword('old_pass_123', '123', '123');
    await expect(settingsPage.passwordError).toHaveText(
      'New password must be at least 8 characters long',
    );

    // 4. Повернення на Українську
    await settingsPage.toggleLanguage();
    await expect(settingsPage.headerTitle).toHaveText('Налаштування акаунту та безпеки');
    await expect(settingsPage.infraBadgePostgres).toHaveText('Підключено');
  });
});
