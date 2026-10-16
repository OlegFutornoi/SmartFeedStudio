import { test, expect } from '@playwright/test';
import { setupSuppliersFeedsRoutes } from '@e2e/fixtures/suppliers-feeds-mock-data';

test.describe('Desktop App — Повноцінний CRM-профіль постачальника (Company, Manager, Warehouse & Smart Avatar)', () => {
  test.beforeEach(async ({ page }) => {
    await setupSuppliersFeedsRoutes(page);
  });

  test('перегляд існуючого постачальника відображає 4 CRM-картки на вкладці Огляду', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Відкриваємо кабінет постачальника Livolo Офіційний
    const avatar = page.getByTestId('supplier-row-avatar-sup_test_1');
    await expect(avatar).toBeVisible();
    await avatar.click();

    // 2. Перевіряємо відкриття панелі та вкладку огляду
    await expect(page.getByTestId('supplier-drawer-sheet')).toBeVisible();
    await expect(page.getByTestId('supplier-drawer-overview-tab')).toBeVisible();

    // 3. Перевіряємо картку 1: Реквізити компанії
    await expect(page.getByTestId('supplier-overview-company-card')).toBeVisible();
    await expect(page.getByTestId('supplier-overview-legal-name')).toHaveText(
      'ТОВ «Ліволо Україна»',
    );
    await expect(page.getByTestId('supplier-overview-tax-id')).toHaveText('38942104');
    await expect(page.getByTestId('supplier-overview-industry')).toHaveText(
      'Розумний дім та електрофурнітура',
    );
    await expect(page.getByTestId('supplier-overview-segment')).toHaveText('Ексклюзивний імпортер');

    // 4. Перевіряємо картку 2: Відповідальний менеджер
    await expect(page.getByTestId('supplier-overview-manager-card')).toBeVisible();
    await expect(page.getByTestId('supplier-overview-manager-name')).toHaveText('Артем Васильєв');
    await expect(page.getByTestId('supplier-overview-manager-position')).toHaveText(
      'Директор з оптових продажів',
    );
    await expect(page.getByTestId('supplier-overview-manager-phone')).toHaveText('+380501112233');
    await expect(page.getByTestId('supplier-overview-manager-email')).toHaveText(
      'a.vasyliev@livolo.ua',
    );
    const telegramLink = page.getByTestId('supplier-overview-manager-telegram');
    await expect(telegramLink).toBeVisible();
    await expect(telegramLink).toHaveAttribute('href', 'https://t.me/livolo_b2b');

    // 5. Перевіряємо картку 3: Склад та логістика
    await expect(page.getByTestId('supplier-overview-warehouse-card')).toBeVisible();
    await expect(page.getByTestId('supplier-overview-city-country')).toContainText('Київ, Україна');
    await expect(page.getByTestId('supplier-overview-address')).toHaveText('вул. Глибочицька, 17');
    await expect(page.getByTestId('supplier-overview-website-link')).toHaveAttribute(
      'href',
      'https://livolo.ua',
    );

    // 6. Перевіряємо картку 4: Комерційні умови
    await expect(page.getByTestId('supplier-overview-commercial-card')).toBeVisible();
  });

  test('створення постачальника з усіма 13 CRM-полями, автопідтягуванням логотипу та валідацією в огляді', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Відкриваємо форму створення
    const addBtn = page.getByTestId('add-supplier-header-btn');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const sheet = page.getByTestId('supplier-form-sheet');
    await expect(sheet).toBeVisible();

    // 2. Заповнюємо базову інформацію
    await page.getByTestId('supplier-name-input').fill('Brain Computers');
    await page.getByTestId('supplier-code-input').fill('BRAIN');
    await page.getByTestId('supplier-website-input').fill('https://brain.com.ua');

    // 3. Перевіряємо смарт-аватар та прямий URL логотипу
    const fetchDomainBtn = page.getByTestId('supplier-avatar-fetch-domain-btn');
    await expect(fetchDomainBtn).toBeVisible();
    await fetchDomainBtn.click();

    // Також тестуємо введення прямого URL логотипу
    await page.getByTestId('supplier-avatar-url-toggle-btn').click();
    await page.getByTestId('supplier-avatar-url-input').fill('https://brain.com.ua/logo.svg');
    await page.getByTestId('supplier-avatar-apply-url-btn').click();

    // 4. Заповнюємо реквізити компанії
    await page.getByTestId('supplier-legal-name-input').fill('ТОВ «Брейн Дистрибʼюшн»');
    await page.getByTestId('supplier-tax-id-input').fill('30370505');
    await page.getByTestId('supplier-industry-input').fill('Електроніка та IT-техніка');
    await page.getByTestId('supplier-segment-input').fill('Офіційний дистрибʼютор');

    // 5. Заповнюємо контакти менеджера
    await page.getByTestId('supplier-manager-name-input').fill('Олександр Коваленко');
    await page.getByTestId('supplier-manager-position-input').fill('Key Account Manager');
    await page.getByTestId('supplier-manager-phone-input').fill('+380674445566');
    await page.getByTestId('supplier-manager-email-input').fill('b2b@brain.com.ua');
    await page.getByTestId('supplier-manager-telegram-input').fill('@brain_b2b');

    // 6. Заповнюємо склад та логістику
    await page.getByTestId('supplier-country-input').fill('Україна');
    await page.getByTestId('supplier-city-input').fill('Київ');
    await page.getByTestId('supplier-address-input').fill('вул. Степана Бандери, 21');
    await page.getByTestId('supplier-postcode-input').fill('04073');

    // 7. Зберігаємо форму
    await page.getByTestId('supplier-sheet-submit-btn').click();
    await expect(sheet).not.toBeVisible();

    // 8. Відкриваємо кабінет створеного постачальника
    const newRow = page.getByRole('row', { name: /Brain Computers/i });
    await expect(newRow).toBeVisible();
    await newRow.getByRole('button', { name: 'Brain Computers' }).click();

    // 9. Верифікуємо, що в огляді відображаються збережені CRM дані
    await expect(page.getByTestId('supplier-drawer-overview-tab')).toBeVisible();
    await expect(page.getByTestId('supplier-overview-legal-name')).toHaveText(
      'ТОВ «Брейн Дистрибʼюшн»',
    );
    await expect(page.getByTestId('supplier-overview-tax-id')).toHaveText('30370505');
    await expect(page.getByTestId('supplier-overview-industry')).toHaveText(
      'Електроніка та IT-техніка',
    );
    await expect(page.getByTestId('supplier-overview-segment')).toHaveText(
      'Офіційний дистрибʼютор',
    );
    await expect(page.getByTestId('supplier-overview-manager-name')).toHaveText(
      'Олександр Коваленко',
    );
    await expect(page.getByTestId('supplier-overview-manager-position')).toHaveText(
      'Key Account Manager',
    );
    await expect(page.getByTestId('supplier-overview-manager-phone')).toHaveText('+380674445566');
    await expect(page.getByTestId('supplier-overview-manager-email')).toHaveText(
      'b2b@brain.com.ua',
    );

    const tgLink = page.getByTestId('supplier-overview-manager-telegram');
    await expect(tgLink).toBeVisible();
    await expect(tgLink).toHaveAttribute('href', 'https://t.me/brain_b2b');

    await expect(page.getByTestId('supplier-overview-city-country')).toContainText('Київ, Україна');
    await expect(page.getByTestId('supplier-overview-address')).toHaveText(
      'вул. Степана Бандери, 21',
    );
  });

  test('редагування CRM-даних постачальника зберігає оновлення та відображає їх в огляді', async ({
    page,
  }) => {
    await page.goto('/suppliers');
    await expect(page.getByTestId('suppliers-page')).toBeVisible();

    // 1. Відкриваємо меню дій першого постачальника
    const row = page.getByTestId('supplier-row-sup_test_1');
    await expect(row).toBeVisible();
    await row.getByRole('button').last().click();

    // 2. Обираємо «Редагувати»
    const editItem = page.getByRole('menuitem', { name: /Редагувати/i });
    await expect(editItem).toBeVisible();
    await editItem.click();

    const sheet = page.getByTestId('supplier-form-sheet');
    await expect(sheet).toBeVisible();

    // 3. Перевіряємо передзаповненість CRM полів
    await expect(page.getByTestId('supplier-legal-name-input')).toHaveValue('ТОВ «Ліволо Україна»');
    await expect(page.getByTestId('supplier-manager-position-input')).toHaveValue(
      'Директор з оптових продажів',
    );

    // 4. Оновлюємо посаду менеджера та місто
    await page.getByTestId('supplier-manager-position-input').fill('Head of Enterprise B2B');
    await page.getByTestId('supplier-city-input').fill('Львів');
    await page.getByTestId('supplier-segment-input').fill('Стратегічний партнер');

    // 5. Зберігаємо оновлення
    await page.getByTestId('supplier-sheet-submit-btn').click();
    await expect(sheet).not.toBeVisible();

    // 6. Відкриваємо кабінет постачальника та перевіряємо оновлені дані
    const avatar = page.getByTestId('supplier-row-avatar-sup_test_1');
    await avatar.click();

    await expect(page.getByTestId('supplier-drawer-overview-tab')).toBeVisible();
    await expect(page.getByTestId('supplier-overview-manager-position')).toHaveText(
      'Head of Enterprise B2B',
    );
    await expect(page.getByTestId('supplier-overview-city-country')).toContainText('Львів');
    await expect(page.getByTestId('supplier-overview-segment')).toHaveText('Стратегічний партнер');
  });
});
