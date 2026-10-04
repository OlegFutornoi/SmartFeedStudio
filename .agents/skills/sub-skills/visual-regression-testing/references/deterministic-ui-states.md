# Deterministic UI States & Dynamic Element Masking

## 1. Заморозка анімацій та переходів через CSS-ін'єкцію

Динамічні переходи CSS (fade-in, slide, hover, pulse) призводять до випадкових розбіжностей на скріншотах:

```typescript
import { Page } from '@playwright/test';

export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });

  // Чекаємо завершення завантаження веб-шрифтів Inter
  await page.evaluate(() => document.fonts.ready);
}
```

## 2. Фіксація системного годинника

Відносний час на зразок "Оновлено 2 хвилини тому" ламає візуальні тести при кожному запуску:

```typescript
// Встановлення фіксованого часу до завантаження сторінки
await page.clock.setFixedTime(new Date('2026-10-04T12:00:00Z'));
await page.goto('/feeds');
```

## 3. Маскування неконтрольованих областей (`mask`)

Для графіків цін або аватарів користувачів:

```typescript
await expect(page).toHaveScreenshot('dashboard.png', {
  mask: [
    page.locator('[data-testid="user-avatar"]'),
    page.locator('[data-testid="realtime-sparkline"]'),
    page.locator('time'),
  ],
  maskColor: '#202020', // Візуальне зафарбовування нейтральним кольором
});
```
