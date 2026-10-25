import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Динамічні курси валют без хардкоду (Local Database & Zero 41.5)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('вкладка «Багатовалютність» не містить захардкодженного 41.5 і завантажує курси з локальної бази', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Відкриваємо картку постачальника Mobioptom
    await page.getByTestId('supplier-name-sup_test_2').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    // 2. Переходимо на вкладку «Джерела фідів»
    await page.getByTestId('supplier-drawer-tab-feeds').click();
    await expect(page.getByTestId('supplier-feeds-tab')).toBeVisible();

    // 3. Відкриваємо налаштування валюти для першого фіду
    const configureFeedCurrencyBtn = page
      .locator('[data-testid^="configure-feed-currency-"]')
      .first();
    await expect(configureFeedCurrencyBtn).toBeVisible();
    await configureFeedCurrencyBtn.click();

    const currenciesTab = page.getByTestId('supplier-currencies-tab');
    await expect(currenciesTab).toBeVisible();

    // 3. Таблиця банківських курсів відображається
    const bankRatesTable = page.getByTestId('compact-bank-rates-table');
    await expect(bankRatesTable).toBeVisible();

    // 4. Обираємо валюту USD
    await page.getByTestId('currency-chip-USD').click();

    // 5. Сувора негативна перевірка: жодного хардкоду 41.50 чи 41,5
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('41.50 ₴/$');
    expect(bodyText).not.toContain('41,50 ₴');

    // 6. Перевіряємо, що в таблиці присутні рядки реальних банків
    const privatRow = page.getByTestId('bank-row-privat');
    await expect(privatRow).toBeVisible();

    // 7. Клік на ПриватБанк підставляє реальний курс продажу банку (> 41)
    await privatRow.click();
    await expect(privatRow).toHaveClass(/bg-primary\/10/);

    const rateInputVal = await page.getByTestId('exchange-rate-input').inputValue();
    const numericRate = parseFloat(rateInputVal.replace(',', '.'));
    expect(numericRate).toBeGreaterThan(41.0);
    expect(numericRate).not.toBe(41.5);

    // 8. Зберігаємо налаштування валюти
    const saveBtn = page.getByTestId('save-currency-btn');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 9. Перевіряємо кнопку повернення до списку фідів
    const backBtn = page.getByTestId('back-to-feeds-list-btn');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page.getByTestId('supplier-feeds-tab')).toBeVisible();
  });
});
