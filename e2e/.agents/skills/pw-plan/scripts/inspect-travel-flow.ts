/**
 * @file inspect-travel-flow.ts
 * @description Дослідницький скрипт (probe/spy tool) для аналізу повного життєвого циклу Travel UI на Finance.ua.
 * Перехоплює та логує реальні мережеві запити (Product Manager API, OTP, збереження контракту, платіжні редиректи)
 * для подальшого проектування та генерації API/E2E тестів.
 *
 * Використання:
 *   npx ts-node .agents/skills/pw-plan/scripts/inspect-travel-flow.ts
 */

import { chromium, Page } from 'playwright';
import { getStageConfig } from '../../../../config/env.helper';

interface TravelInspectOptions {
  headless?: boolean;
  baseUrl?: string;
}

export async function inspectTravelFlow(options: TravelInspectOptions = {}) {
  const stageConfig = getStageConfig();
  const baseUrl =
    options.baseUrl ??
    stageConfig.BASE_URL_FINANCE_TRAVEL ??
    'https://finance-travel-stage.treeumapp.net';
  const headless = options.headless ?? true;

  console.log(`\n🚀 [INSPECT-TRAVEL] Запуск дослідження Travel UI Flow на: ${baseUrl}`);
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page: Page = await context.newPage();

  // 1. Мережевий шпигун (Network Request/Response Spy)
  page.on('request', (req) => {
    const url = req.url();
    if (
      url.includes('/insurance/') ||
      url.includes('/otp/') ||
      url.includes('portmone') ||
      url.includes('pay.')
    ) {
      console.log(`\n>>> [API REQ] ${req.method()} ${url}`);
      const postData = req.postData();
      if (postData) {
        console.log(`    Payload: ${postData.substring(0, 300)}`);
      }
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (
      url.includes('/insurance/') ||
      url.includes('/otp/') ||
      url.includes('portmone') ||
      url.includes('pay.')
    ) {
      let body = '';
      try {
        body = await res.text();
      } catch {}
      console.log(`<<< [API RES ${res.status()}] ${url}`);
      if (body) {
        console.log(`    Body: ${body.substring(0, 300)}`);
      }
    }
  });

  // 2. SSR ін'єкція тестової компанії 376 (за потреби)
  await page.route('**/ua/insurance/travel?catalog=true*', async (route) => {
    const response = await route.fetch();
    let html = await response.text();
    const match = html.match(
      /window\.APP_INITIAL_STATE\s*=\s*(\{[\s\S]*?\});\s*window\.APP_TRANSLATIONS_LOCALE/,
    );
    if (match) {
      try {
        const state = eval('(' + match[1] + ')');
        if (state.companies && state.companies.entities) {
          const sample =
            state.companies.entities['188'] || Object.values(state.companies.entities)[0];
          state.companies.entities['376'] = {
            ...sample,
            id: 376,
            title: 'Finance Test Insurance',
            name: 'finance-test-insurance',
            alias: 'finance-test-insurance',
          };
          if (state.companies.ids && !state.companies.ids.includes(376)) {
            state.companies.ids.push(376);
          }
          html = html.replace(match[1], JSON.stringify(state));
        }
      } catch (err) {
        console.warn('Помилка модифікації SSR стану:', err);
      }
    }
    await route.fulfill({ response, body: html });
  });

  // 3. Роут OTP запитів на бекенд
  await page.route(
    '**/product-manager-integration.finance.ua/api/v1/insurance/otp/*',
    async (route) => {
      const originalUrl = route.request().url();
      const urlObj = new URL(originalUrl);
      const newUrl = new URL(urlObj.pathname, baseUrl).toString();
      console.log(`[OTP REWRITE]: ${originalUrl} -> ${newUrl}`);
      await route.continue({ url: newUrl });
    },
  );

  try {
    // Крок 1: Відкриття каталогу
    console.log('\n--- Крок 1: Відкриття каталогу Travel ---');
    const catalogUrl = `${baseUrl}/ua/insurance/travel?catalog=true&country=272&locationInsured=UKRAINE&coverageDay=32&tripProgram=standart`;
    await page.goto(catalogUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const ctaBtn = page
      .locator(
        "#products article button, button[data-state*='order'], button:has-text('Оформити'), button:has-text('ОФОРМИТИ')",
      )
      .first();
    await ctaBtn.waitFor({ state: 'visible', timeout: 45000 });
    console.log('Знайдено кнопку оформлення пропозиції. Клік...');
    await ctaBtn.click();

    // Крок 2: Екран вибору програми
    console.log('\n--- Крок 2: Екран програми страхування ---');
    const programNextBtn = page
      .locator("button[data-state='button-forward'], button:has-text('Продовжити')")
      .first();
    await programNextBtn.waitFor({ state: 'visible', timeout: 30000 });
    await programNextBtn.click();

    // Крок 3: Екран контактів
    console.log('\n--- Крок 3: Екран контактних даних ---');
    const lastNameInput = page
      .locator("input[name='lastName'], input[data-state='input-lastName']")
      .first();
    await lastNameInput.waitFor({ state: 'visible', timeout: 30000 });
    await lastNameInput.fill('Тестовий');
    await page
      .locator("input[name='firstName'], input[data-state='input-firstName']")
      .first()
      .fill('Олег');
    await page
      .locator("input[name='phoneNumber'], input[name='phone'], input[data-state='input-phone']")
      .first()
      .fill('+380501234567');
    await page
      .locator("input[name='email'], input[data-state='input-email']")
      .first()
      .fill('test-travel@example.com');

    const contactsNextBtn = page
      .locator("button[data-state='button-forward'], button:has-text('Продовжити')")
      .first();
    await contactsNextBtn.click();

    // Крок 4: Екран персональних даних (паспорт, ІПН)
    console.log('\n--- Крок 4: Екран персональних даних ---');
    const passportSeriesInput = page
      .locator("input[name='passportSeries'], input[data-state='input-passportSeries']")
      .first();
    await passportSeriesInput.waitFor({ state: 'visible', timeout: 30000 });
    await passportSeriesInput.fill('АА');
    await page
      .locator("input[name='passportNumber'], input[data-state='input-passportNumber']")
      .first()
      .fill('123456');
    await page
      .locator("input[name='taxNumber'], input[name='inn'], input[data-state='input-inn']")
      .first()
      .fill('3234567890');
    await page
      .locator("input[name='birthDate'], input[data-state='input-birthDate']")
      .first()
      .fill('15.05.1990');

    const localityInput = page
      .locator("input[name='locality'], input[data-state='input-locality']")
      .first();
    if (await localityInput.isVisible()) {
      await localityInput.fill('Київ');
    }

    const personalNextBtn = page
      .locator("button[data-state='button-forward'], button:has-text('Продовжити')")
      .first();
    await personalNextBtn.click();

    // Крок 5: Checkout екран
    console.log('\n--- Крок 5: Checkout / Підтвердження ---');
    const checkoutSubmitBtn = page
      .locator(
        "button[data-state='button-forward'], button:has-text('Перейти до оплати'), button:has-text('Оформити')",
      )
      .first();
    await checkoutSubmitBtn.waitFor({ state: 'visible', timeout: 30000 });
    await checkoutSubmitBtn.click();

    // Крок 6: OTP верифікація
    console.log('\n--- Крок 6: OTP верифікація ---');
    const otpInput = page
      .locator(
        "input[data-state='input-otp'], input[data-state='input-confirmSms'], input[autocomplete='one-time-code']",
      )
      .first();
    if (await otpInput.isVisible({ timeout: 15000 })) {
      console.log('Введення тестового OTP коду: 123456');
      await otpInput.fill('123456');
      const otpSubmitBtn = page
        .locator("button[data-state='button-submit-otp'], button:has-text('Підтвердити')")
        .first();
      if (await otpSubmitBtn.isVisible()) {
        await otpSubmitBtn.click();
      }
    }

    // Крок 7: Очікування платіжної сторінки
    console.log('\n--- Крок 7: Очікування редиректу на оплату ---');
    await page.waitForURL(/portmone\.com\.ua|prt\.mn|pay\.finance/i, { timeout: 30000 });
    console.log('✅ Успішний редирект на платіжний шлюз:', page.url());
  } catch (error) {
    console.error('❌ Помилка під час дослідження флоу:', error);
  } finally {
    await browser.close();
    console.log('🏁 Дослідження завершено, браузер закрито.\n');
  }
}

// Запуск якщо викликано безпосередньо з CLI
if (require.main === module) {
  const isHeadless = !process.argv.includes('--headed');
  inspectTravelFlow({ headless: isHeadless }).catch(console.error);
}
