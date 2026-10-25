/* eslint-disable */
import { test, chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://finance.ua/ua/insurance/osago');

  // Натискаємо "За параметрами"
  await page.getByRole('button', { name: 'За параметрами' }).click();

  // Отримуємо всі типи транспортних засобів
  const typeToggle = page
    .getByRole('button', { name: 'Тип транспортного засобу' })
    .or(page.locator('button').filter({ hasText: 'Тип транспортного засобу' }));
  await typeToggle.click();

  // Щоб отримати список, зачекаємо трохи
  await page.waitForTimeout(1000);
  const vehicleTypes = await page.getByRole('menuitem').allTextContents();
  console.log(
    'Vehicle types found:',
    vehicleTypes.map((t) => t.trim()),
  );

  // Тепер перевіримо конкретні типи, які падають
  const typesToTest = ['Автобус', 'Електромобіль', 'Причіп', 'Вантажівка'];

  for (const vType of typesToTest) {
    console.log(`\n--- ${vType} ---`);
    // Клікаємо на тип авто
    await page.getByRole('menuitem', { name: new RegExp(`^\\s*${vType}\\s*$`, 'i') }).click();
    await page.waitForTimeout(1000); // чекаємо анімацію

    // Знаходимо другий селект (параметр)
    // В locators.ts parameterToggle - це button з title або hasText. Але ми не знаємо текст, тому знайдемо просто наступний button, який відкриває меню
    // Всі кнопки параметрів зазвичай поруч, тому знайдемо всі кнопки, які мають title
    const buttons = await page.locator('button[title]').all();
    // Вантажівка має "Вантажопідйомність", Автобус - "Кількість місць", Електромобіль - "Рік випуску авто", Причіп - "Тип причепа"
    let paramBtn = null;
    for (const btn of buttons) {
      const title = await btn.getAttribute('title');
      if (
        title &&
        [
          'Вантажопідйомність',
          'Кількість місць',
          'Рік випуску авто',
          'Тип ТЗ до якого причіп',
          'Тип причепа',
          'Вантажність',
        ].some((t) => title.includes(t))
      ) {
        paramBtn = btn;
        break;
      }
    }

    if (paramBtn) {
      console.log(`Clicking: ${await paramBtn.getAttribute('title')}`);
      await paramBtn.click();
      await page.waitForTimeout(1000);

      // Дістаємо опції
      const options = await page.getByRole('menuitem').allTextContents();
      if (options.length > 0) {
        console.log(
          'Options (menuitem):',
          options.map((o) => o.trim()),
        );
      } else {
        const options2 = await page.getByRole('option').allTextContents();
        console.log(
          'Options (option):',
          options2.map((o) => o.trim()),
        );
      }

      // Закриваємо
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('No parameter button found for', vType);
    }

    // Відкриваємо знову меню типів авто
    // Кнопка тепер має title = vType
    await page.locator(`button[title="${vType}"]`).click();
    await page.waitForTimeout(500);
  }

  await browser.close();
})();
