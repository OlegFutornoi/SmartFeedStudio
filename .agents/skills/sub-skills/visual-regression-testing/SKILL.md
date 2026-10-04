---
name: visual-regression-testing
version: 1.0.0
description: 'Use for Playwright visual regression testing: pixel-perfect screenshot assertions, 100% solid sticky header checks, dark/light theme visual verification, and animation freezing.'
metadata:
  requires:
    packages: ['@playwright/test']
---

# visual-regression-testing

Інженерний стандарт візуального регресійного тестування у SmartFeed Studio: еталонні скріншоти (visual snapshots) у Playwright, перевірка непрозорості sticky-шапок, гармонії темної/світлої тем та відсікання флакі-дифів.

## Залізні принципи візуального тестування

1. **Детермінізм рендерингу (Zero Flaky Diffs)**: Перед зняттям скріншота обов'язково заморожуються всі CSS-анімації (`animations: 'disabled'`), зупиняються таймери та маскуються динамічні елементи (поточний час, відносні дати "5 хвилин тому", аватари).
2. **Візуальна верифікація Solid Sticky Headers**: Тест скролу таблиці товарів/ліцензій обов'язково робить скріншот під час прокрутки, щоб довести, що шапка таблиці (`thead.sticky.top-0`) на 100% непрозора (`bg-card`/`bg-background`) і текст під нею не просвічується.
3. **Парний контроль тем (Dark & Light Matrix)**: Будь-який новий екран або віджет тестується у двох кольорових режимах. Будь-які "білі плями" у темній темі або неконтрастні іконки вважаються візуальним дефектом.
4. **Калібрування порогу розбіжності (maxDiffPixelRatio)**: Для захисту від антиаліасингу шрифтів між ОС використовується суворий ліміт: `maxDiffPixelRatio: 0.01` (максимум 1% пікселів) або `maxDiffPixels: 50`.

## Матриця виклику інструкцій (Triggers → References)

| Тригер / Потреба                                 | Цільовий reference-файл                                                                  | Ключовий фокус                                                                       |
| :----------------------------------------------- | :--------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| Написання тестів скріншотів `toHaveScreenshot()` | [`references/playwright-visual-snapshots.md`](references/playwright-visual-snapshots.md) | Налаштування Playwright snapshots, калібрування порогів, оновлення бейзлайнів        |
| Заморозка анімацій, маскування динамічних дат    | [`references/deterministic-ui-states.md`](references/deterministic-ui-states.md)         | CSS-ін'єкція вимкнення анімацій, `mask: []`, фіксація годинника `clock.setFixedTime` |
| Перевірка Solid Sticky Header, Light/Dark тем    | [`references/theme-and-viewport-matrix.md`](references/theme-and-viewport-matrix.md)     | Тест скролу шапок таблиць, матриця тем, адаптивні розширення (1440px / 768px)        |

## Категорично заборонено

- Знімати скріншоти без відключення анімацій (призводить до флакі-тестів у CI).
- Ігнорувати візуальні артефакти просвічування тексту крізь sticky-шапки.
- Використовувати довільні скріншоти всього екрана без маскування динамічних дат чи випадкових ID.
- Підвищувати `maxDiffPixelRatio` вище 0.05 замість усунення справжнього візуального дефекту.
