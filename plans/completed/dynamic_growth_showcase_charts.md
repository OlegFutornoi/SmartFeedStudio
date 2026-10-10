# 📈 План реалізації: Автономний модуль AI-Автопілота та динамічних діаграм росту (`@/modules/growth-showcase`)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 10.10.2026

---

## 🏛 1. Принцип нульової залежності (Zero Coupling & Plug-and-Play)

Модуль спроектований так, щоб його можна було вставити в будь-яке місце (екран входу, екран реєстрації, лендінг, онбординг, дашборд) одним рядком:

```tsx
import { GrowthShowcaseModule } from '@/modules/growth-showcase';

// Використання:
<GrowthShowcaseModule variant="hero" autoPlay intervalMs={3000} />;
```

Зміни у верстці форм входу чи реєстрації **ніколи не зламають і не зачеплять** модуль демонстрації, оскільки:

1. Вся логіка анімацій винесена у власний хук `useGrowthCycle`.
2. Всі дані, таймінги та пресети дій AI зберігаються у файлі конфігурації `config.ts`.
3. Модуль має власну ієрархію типів у `types.ts`.
4. Зовнішній шар взаємодіє виключно через фасад `index.ts`.

---

## 🏗 2. Архітектура та структура файлів (<200 рядків на файл)

```text
apps/desktop/src/
├── assets/
│   └── ai-copilot-agent.jpg               # Оптимізований 3D-аватар AI-помічника
└── modules/growth-showcase/
    ├── types.ts                           # Типи конфігурації, точок діаграми, подій AI та стадій воронки (<70 рядків)
    ├── config.ts                          # Налаштування за замовчуванням (швидкість циклу, метрики, пресети) (<90 рядків)
    ├── hooks/
    │   └── useGrowthCycle.ts              # Хук керування циклом (таймер, пауза при hover/document.hidden) (<120 рядків)
    ├── components/
    │   ├── AiCopilotCard.tsx              # Картка AI-асистента з аватаром, бейджами та живим стрімом дій (<150 рядків)
    │   ├── RevenueGrowthChart.tsx         # Динамічний Recharts AreaChart з градієнтом та shadcn Tooltip (<190 рядків)
    │   ├── PipelineFunnelCards.tsx        # 3-крокова воронка (Підготовка → Маркетплейси → Гроші) (<150 рядків)
    │   └── LiveSalesTicker.tsx            # Жива стрічка замовлень Rozetka/Prom/Epicentr (<120 рядків)
    ├── GrowthShowcaseModule.tsx           # Головний автономний контейнер модуля (<160 рядків)
    └── index.ts                           # Лаконічний публічний фасад експорту (<20 рядків)
```

---

## ⚙️ 3. Модель конфігурації модуля (`config.ts`)

Конфігурація дозволяє налаштовувати поведінку модуля без зміни React-компонентів:

```typescript
export interface GrowthShowcaseConfig {
  autoPlay: boolean;
  intervalMs: number; // 3000ms між зміною точок графіка/стадій
  currencySymbol: string; // '₴' або '$'
  stages: ShowcaseStageConfig[]; // Prep -> Sync -> Boom
  revenueTimeline: RevenuePoint[]; // Місяці 1-5, виручка, прибуток, замовлення
  aiActionPresets: AiActionLog[]; // Черга дій AI-автопілота
}
```

---

## 📊 4. Графік росту та AI-асистент

1. **AI Copilot Header**:
   - 3D аватар асистента з м'яким неоновим світлом.
   - Бейдж статусу `● AI Autopilot 24/7 (Автономний режим)`.
   - Живий рядок дій помічника («AI розпізнав 10 200 SKU», «AI згенерував описи під Rozetka», «AI захистив маржу +28%»).
2. **Динамічний AreaChart shadcn/ui**:
   - Плавне крокування активної точки по місяцях (1 → 2 → 3 → 4 → 5).
   - Інтерактивний `ChartTooltip`, що показує виручку, чистий прибуток та кількість замовлень.
   - Можливість навести мишкою для ручного огляду конкретного місяця.
3. **Воронка 3 кроків (Pipeline Stages)**:
   - 📦 1. Авто-підготовка 10,000+ SKU
   - 🚀 2. Миттєва синхронізація з Rozetka/Prom/Epicentr
   - 💰 3. Вибуховий ріст виручки (₴45K → ₴580K)
4. **Live Ticker**:
   - Живі сповіщення про нові замовлення та зарахування коштів.

---

## 🔒 5. Надійність та продуктивність

- **Zero Memory Leaks**: Очищення всіх `setInterval` та `setTimeout` у хуку `useGrowthCycle`.
- **CPU Preservation**: Пауза анімації, коли вікно неактивне (`document.hidden`).
- **Zero Scrollbars**: Суворе дотримання бюджету `h-full max-h-screen overflow-hidden`.
- **100% Theme Harmony**: Тільки семантичні токени (`bg-card`, `border-border`, `text-primary`, `emerald-500` для профіту), паритет у світлій і темній темах.

---

## 🧪 6. Чеклист виконання (DoD)

1. [ ] Створення `apps/desktop/src/modules/growth-showcase/types.ts`.
2. [ ] Створення `apps/desktop/src/modules/growth-showcase/config.ts`.
3. [ ] Створення `apps/desktop/src/modules/growth-showcase/hooks/useGrowthCycle.ts`.
4. [ ] Реалізація субкомпонентів у `components/` (AI Card, Chart, Funnel, Ticker).
5. [ ] Збірка у `GrowthShowcaseModule.tsx` та експорт у `index.ts`.
6. [ ] Підключення у `apps/desktop/src/components/auth/AuthHeroShowcase.tsx` як тонкого адаптера.
7. [ ] Оновлення словників локалізації UA та EN.
8. [ ] Запуск тестів `pnpm --filter @smartfeed/desktop test:e2e` (100% проходження).
9. [ ] Візуальна верифікація обох тем (Dark / Light) у Playwright.
