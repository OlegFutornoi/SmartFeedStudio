import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Преміальна UX-панель постачальників (Right Slide Sheet, Clean Form & 5 Banks Rates)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('додавання постачальника відкриває Slide-Over Sheet праворуч (side=right) без чорного затемнення', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Натискаємо кнопку додавання постачальника
    const addBtn = page.getByTestId('add-supplier-header-btn');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 2. Переконуємось, що відкрився Slide-Over Sheet
    const sheet = page.getByTestId('supplier-form-sheet');
    await expect(sheet).toBeVisible();

    // 3. Переконуємось, що класичного модального вікна немає
    await expect(page.locator('[data-testid="supplier-create-dialog"]')).toHaveCount(0);

    // 4. Перевіряємо наявність вибору логотипу, полів сайту та відсутність полів націнок
    await expect(page.getByTestId('supplier-avatar-picker')).toBeVisible();
    await expect(page.getByTestId('supplier-name-input')).toBeVisible();
    await expect(page.getByTestId('supplier-code-input')).toBeVisible();
    await expect(page.getByTestId('supplier-website-input')).toBeVisible();

    // У формі створення немає полів націнок (zero clutter)
    await expect(page.getByTestId('supplier-margin-input')).toHaveCount(0);

    // 5. Тестуємо введення вебсайту та появу кнопки швидкого переходу
    await page.getByTestId('supplier-website-input').fill('https://example-supplier.com');
    const openSiteBtn = page.getByTestId('open-supplier-website-btn');
    await expect(openSiteBtn).toBeVisible();

    // 6. Закриваємо через кнопку «Скасувати»
    await page.getByTestId('supplier-sheet-cancel-btn').click();
    await expect(sheet).not.toBeVisible();
  });

  test('редагування постачальника відкриває Slide-Over Sheet праворуч з передзаповненими даними', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Відкриваємо меню дій для постачальника
    const row = page.getByTestId('supplier-row-sup_test_1');
    await expect(row).toBeVisible();
    await row.getByRole('button').last().click();

    // 2. Обираємо «Редагувати»
    const editItem = page.getByRole('menuitem', { name: /Редагувати/i });
    await expect(editItem).toBeVisible();
    await editItem.click();

    // 3. Перевіряємо відкриття Sheet праворуч
    const sheet = page.getByTestId('supplier-form-sheet');
    await expect(sheet).toBeVisible();

    // 4. Перевіряємо передзаповнені дані
    await expect(page.getByTestId('supplier-name-input')).toHaveValue('Livolo Офіційний');
    await expect(page.getByTestId('supplier-code-input')).toHaveValue('LIVOLO-UA');

    // 5. Оновлюємо сайт та зберігаємо
    await page.getByTestId('supplier-website-input').fill('https://livolo.in.ua');
    await expect(page.getByTestId('open-supplier-website-btn')).toBeVisible();
    await page.getByTestId('supplier-sheet-submit-btn').click();

    // 6. Панель успішно закривається
    await expect(sheet).not.toBeVisible();
  });

  test('панель деталей постачальника містить шапку, охайні вкладки у стилі меню та віджет 5 банків', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Натискаємо на аватар постачальника в таблиці
    const avatar = page.getByTestId('supplier-row-avatar-sup_test_1');
    await expect(avatar).toBeVisible();
    await avatar.click();

    // 2. Перевіряємо шапку бічної панелі огляду
    await expect(page.getByTestId('supplier-drawer-header')).toBeVisible();
    await expect(page.getByTestId('supplier-drawer-avatar')).toBeVisible();
    await expect(page.getByTestId('supplier-drawer-name')).toHaveText('Livolo Офіційний');

    // 3. Перевіряємо вкладку огляду
    await expect(page.getByTestId('supplier-drawer-overview-tab')).toBeVisible();

    // 4. Переходимо у вкладку «Багатовалютність»
    const currenciesTab = page.getByTestId('supplier-drawer-tab-currencies');
    await expect(currenciesTab).toBeVisible();
    await currenciesTab.click();

    // 5. Перевіряємо наявність преміум-віджета курсів 5 провідних банків
    const banksTable = page.getByTestId('compact-bank-rates-table');
    await expect(banksTable).toBeVisible();

    // Перевіряємо наявність рядків усіх 5 банків
    await expect(page.getByTestId('bank-row-nbu')).toBeVisible();
    await expect(page.getByTestId('bank-row-privat')).toBeVisible();
    await expect(page.getByTestId('bank-row-mono')).toBeVisible();
    await expect(page.getByTestId('bank-row-raiffeisen')).toBeVisible();
    await expect(page.getByTestId('bank-row-pumb')).toBeVisible();

    // 6. Тестуємо застосування курсу Monobank в 1 клік на рядок
    const monoRow = page.getByTestId('bank-row-mono');
    await expect(monoRow).toBeVisible();
    await monoRow.click();

    // Перевіряємо, що рядок Monobank позначено як обраний
    await expect(monoRow).toHaveClass(/bg-primary\/10/);

    // Перевіряємо наявність блоку калькулятора та кнопки збереження
    await expect(page.getByTestId('exchange-rate-input')).toBeVisible();
    await expect(page.getByTestId('converted-currency-price')).toBeVisible();
    await expect(page.getByTestId('save-currency-btn')).toBeVisible();
  });

  test('модернізована вкладка «Багатовалютність»: автопідстановка курсу при зміні UAH ➔ USD (без 1 ₴/$), пресети буфера, синхронізація з банками та симулятор у вікні', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    await page.getByTestId('supplier-name-sup_test_2').click();
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();

    await page.getByTestId('supplier-drawer-tab-currencies').click();
    const currenciesTab = page.getByTestId('supplier-currencies-tab');
    await expect(currenciesTab).toBeVisible();

    // Formula hierarchy bar is visible
    await expect(page.getByTestId('currency-formula-banner')).toBeVisible();

    // Switch from UAH to USD via quick currency chip -> rate must auto-populate (> 30 UAH/$), never stay 1
    await page.getByTestId('currency-chip-USD').click();
    const rateVal = Number(await page.getByTestId('exchange-rate-input').inputValue());
    expect(rateVal).toBeGreaterThan(30);

    // Click +2% risk buffer quick preset chip
    await page.getByTestId('currency-buffer-chip-2').click();
    await expect(page.getByTestId('currency-buffer-input')).toHaveValue('2');
    await expect(page.getByTestId('effective-rate-badge')).toBeVisible();

    // Click Monobank row in Bank Rates table -> updates rate & highlights row
    const monoRow = page.getByTestId('bank-row-mono');
    await monoRow.click();
    await expect(monoRow).toHaveClass(/bg-primary\/10/);

    // Simulator is visible in viewport without clipping and quick test chip $100 works
    await expect(page.getByTestId('converted-currency-price')).toBeInViewport();
    await page.getByTestId('currency-sim-chip-100').click();
    await expect(page.getByTestId('currency-sim-cost-input')).toHaveValue('100');

    // Open rounding dropdown, add custom .49 rule, verify simulator ending & delete custom rule
    await page.getByTestId('price-rounding-select').click();
    await expect(page.getByTestId('price-rounding-popover')).toBeVisible();
    await page.getByTestId('custom-rounding-value-input').fill('49');
    await page.getByTestId('add-custom-rounding-btn').click();
    await expect(page.getByTestId('rounding-option-CUSTOM_DEC_49')).toBeVisible();
    await expect(page.getByTestId('converted-currency-price')).toContainText('.49 ₴');

    // Delete custom rule from dropdown
    await page.getByTestId('delete-rounding-rule-CUSTOM_DEC_49').click();
    await expect(page.getByTestId('rounding-option-CUSTOM_DEC_49')).toHaveCount(0);

    // Save currency settings
    await page.getByTestId('save-currency-btn').click();
  });
});
