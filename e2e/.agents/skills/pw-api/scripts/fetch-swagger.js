/* eslint-disable */
/**
 * Скрипт для відкриття Swagger UI у видимому браузері, авторизації через Cloudflare Access
 * та автоматичного витягу повної OpenAPI специфікації в tests/api/docs/ibpm-swagger.json.
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Запуск браузера для авторизації у Swagger UI...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const targetUrl = 'https://insurance-bpm-api-prod.treeumapp.net/admin/?routeName=app.swagger_ui';
  console.log(`🔗 Відкриваємо: ${targetUrl}`);

  let swaggerJson = null;

  // Перехоплюємо мережеві запити на OpenAPI/Swagger JSON
  page.on('response', async (response) => {
    const url = response.url();
    if (
      url.includes('doc.json') ||
      url.includes('swagger.json') ||
      url.includes('api-docs') ||
      url.includes('swagger') ||
      url.includes('openapi')
    ) {
      try {
        const text = await response.text();
        if (
          text.startsWith('{') &&
          (text.includes('"swagger"') || text.includes('"openapi"') || text.includes('"paths"'))
        ) {
          console.log(`🎉 Перехоплено OpenAPI специфікацію з: ${url}`);
          swaggerJson = text;
        }
      } catch (e) {
        // ігноруємо помилки читання бінарних чи закритих відповідей
      }
    }
  });

  await page.goto(targetUrl);
  console.log(
    '⏳ Будь ласка, виконайте вхід через Google Workspace у відкритому вікні браузера...',
  );

  try {
    // Очікуємо завантаження Swagger UI контейнера до 3 хвилин
    await page.waitForSelector('.swagger-ui, #swagger-ui, .swagger-container', { timeout: 180000 });
    console.log('✅ Swagger UI завантажено! Чекаємо фіналізації запитів...');
    await page.waitForTimeout(4000);

    // Якщо мережевий перехоплювач не зловив, дістаємо зі Swagger UI об'єкта або DOM
    if (!swaggerJson) {
      console.log('🔍 Спробуємо отримати spec напряму з DOM / window.ui...');
      swaggerJson = await page.evaluate(async () => {
        // 1. Спробувати дістати з глобального Swagger UI об'єкта
        const win = window;
        if (win.ui && win.ui.specSelectors && win.ui.specSelectors.specJson) {
          try {
            return JSON.stringify(win.ui.specSelectors.specJson().toJS());
          } catch (e) {}
        }

        // 2. Спробувати знайти URL в input .download-url-input
        const input = document.querySelector('.download-url-input');
        if (input && input.value) {
          try {
            const res = await fetch(input.value);
            return await res.text();
          } catch (e) {}
        }

        return null;
      });
    }

    const outDir = path.resolve(__dirname, '../../../tests/api/docs');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, 'ibpm-swagger.json');

    if (swaggerJson) {
      const formatted =
        typeof swaggerJson === 'string'
          ? JSON.stringify(JSON.parse(swaggerJson), null, 2)
          : JSON.stringify(swaggerJson, null, 2);
      fs.writeFileSync(outPath, formatted, 'utf-8');
      console.log(`💾 Специфікацію успішно збережено у: ${outPath}`);
    } else {
      const html = await page.content();
      fs.writeFileSync(path.join(outDir, 'ibpm-swagger-page.html'), html, 'utf-8');
      console.log(`⚠️ Збережено HTML сторінки у: ${path.join(outDir, 'ibpm-swagger-page.html')}`);
    }
  } catch (err) {
    console.error('❌ Помилка або таймаут:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 Браузер закрито.');
  }
})();
