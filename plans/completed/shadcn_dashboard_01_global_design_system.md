# 🎨 План стандартизації дизайну Admin Portal під shadcn/ui New York v4 (dashboard-01)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 10.10.2026  
> **Мета:** Привести стилі, типографіку, розміри шрифтів, відступи та розмітку `apps/admin-portal` у 100% відповідність до офіційного шаблону `shadcn/ui` New York v4 `dashboard-01` (`https://ui.shadcn.com/view/new-york-v4/dashboard-01`).  
> **Ключова вимога:** Повна ліквідація велетенських надлишкових банерів-заголовків (`H1` + підзаголовок опису на 120-150px) на всіх внутрішніх сторінках (`/users`, `/licenses`, `/transactions`, `/navigation`, `/plans`, `/settings`), перенесення активної назви у компактний breadcrumb верхнього хедера та переміщення кнопок дій у контекстні тулбари.

---

## 🔍 1. Аналіз поточного стану проти shadcn `dashboard-01`

### 1.1. Що ми маємо зараз (Проблема "Безвкусиці" та втрати вертикального простору)

З аналізу наданих скріншотів (`/`, `/users`, `/licenses`, `/transactions`, `/navigation`):

1. **Надлишкові заголовки сторінок**:
   - На сторінці `/users`: блок із великою іконкою `Users`, заголовком `text-2xl sm:text-3xl font-bold` «Користувачі» та підзаголовком «Керування обліковими записами, ролями та підписками платформи».
   - На сторінці `/licenses`: блок `KeyRound` + `text-2xl sm:text-3xl` «Видані ліцензії» + довгий опис підписок + відокремлена кнопка «Тарифи».
   - На сторінці `/transactions`: блок `Receipt` + `text-2xl font-semibold` «Журнал транзакцій» + опис рахунків WayForPay + відокремлена кнопка «Експорт CSV».
   - На сторінці `/navigation` (виділена користувачем синьою рамкою): блок `Compass` + `text-2xl sm:text-3xl` «Навігація & Система доступів» + опис структури меню + окрема кнопка «+ Додати пункт меню».
   - На сторінці `/plans`: блок `Layers` + `text-2xl sm:text-3xl` «Тарифні плани» + опис.
2. **Чому це погано**:
   - Активний пункт сайдбару вже чітко підсвічений і повідомляє користувачеві, де він знаходиться.
   - Велетенський заголовок займає від 120 до 160 пікселів вертикальної корисної площі першого екрана.
   - Користувачеві доводиться скролити вниз, щоб побачити перший рядок таблиці або графік.
   - Кнопки дій («+ Створити», «+ Додати пункт меню», «Експорт CSV») розкидані: частина в правому кутку банера заголовка, частина в тулбарі фільтрів.

### 1.2. Як побудовано shadcn New York v4 `dashboard-01`

1. **Sticky Header (`h-14` / `h-12`)**:
   - Кнопка згортання сайдбара `<SidebarTrigger className="-ml-1" />`.
   - Вертикальний розділювач `<Separator orientation="vertical" className="mx-2 h-4" />`.
   - Компактні хлібні крихти або заголовок поточної сторінки:
     `<Breadcrumb>` → `SmartFeed / <BreadcrumbPage className="text-sm font-medium">Користувачі</BreadcrumbPage>`.
   - Праворуч: глобальний пошук `⌘K`, перемикач мови `UA ⇄ EN`, перемикач теми `Sun / Moon`.
2. **Контейнер основного контенту**:
   - Відступи: `p-4 md:p-6` замість роздутих `p-8`.
   - Безпосередній перехід до робочих інструментів: метрики (Cards Grid) або таблиця з інтегрованим тулбаром дій.
3. **Єдині дизайн-токени (Single Source of Truth)**:
   - Картки: `rounded-xl border border-border/80 bg-card text-card-foreground shadow-xs`.
   - Метрики: заголовок `text-sm font-medium text-muted-foreground`, значення `text-2xl font-semibold tabular-nums text-foreground @[250px]/card:text-3xl`, бейдж `rounded-full border px-2 py-0.5 text-xs font-medium`.
   - Тулбари таблиць: компактні поля пошуку `h-8 text-xs`, випадаючі списки фільтрів `h-8 text-xs`, кнопки дій `h-8 text-xs px-3 font-medium`.

---

## 🏛 2. Архітектурне рішення: Єдине джерело правди (Single Source of Truth)

### 2.1. Хлібні крихти та назва сторінки у глобальному `Header`

Створити компонент `Breadcrumb` за специфікацією `shadcn/ui` New York v4 і вбудувати його в `apps/admin-portal/src/components/layout/header.tsx`.

```tsx
// apps/admin-portal/src/components/layout/header.tsx
<header className="h-14 border-b border-border/80 bg-background/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 gap-4">
  <div className="flex items-center gap-2">
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      onClick={toggleSidebar}
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
    <Separator orientation="vertical" className="h-4 mx-1" />
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden sm:inline-flex">
          <BreadcrumbLink href="/" className="text-sm text-muted-foreground hover:text-foreground">
            SmartFeed
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden sm:inline-flex" />
        <BreadcrumbItem>
          <BreadcrumbPage
            data-testid={currentRouteMeta.testId}
            className="text-sm font-medium text-foreground"
          >
            {currentRouteMeta.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  </div>
  ...
</header>
```

#### Мапа маршрутів та збереження testid (100% сумісність із Playwright E2E тестами):

| Маршрут              | Назва (UK / EN)                                          | `data-testid` (збережено для тестів) |
| :------------------- | :------------------------------------------------------- | :----------------------------------- |
| `/`                  | Дашборд / Dashboard                                      | `dashboard-header-title`             |
| `/users`             | Користувачі / Users                                      | `users-header-title`                 |
| `/licenses`          | Видані ліцензії / Issued Customer Licenses               | `licenses-header-title`              |
| `/plans`             | Тарифні плани / Tariff Plans                             | `plans-header-title`                 |
| `/transactions`      | Журнал транзакцій / Payment Transactions                 | `transactions-header-title`          |
| `/navigation`        | Навігація & Система доступів / Navigation Access Control | `navigation-header-title`            |
| `/settings`          | Налаштування акаунту та безпеки / Account Security       | `settings-header-title`              |
| `/settings/payments` | Платіжні системи / Payment Gateways                      | `payments-header-title`              |
| `/settings/ai`       | AI Провайдери / AI Providers                             | `ai-header-title`                    |

---

## 📐 3. Типографіка та Дизайн-токени (shadcn New York v4)

Всі розміри шрифтів та відступи приведені до єдиної шкали:

| Елемент                         | Класи Tailwind                                                               | Опис                                                |
| :------------------------------ | :--------------------------------------------------------------------------- | :-------------------------------------------------- |
| **Хедер сторінки / Breadcrumb** | `text-sm font-medium text-foreground`                                        | Компактний, акуратний, без шуму                     |
| **Заголовок секції / картки**   | `text-base font-semibold tracking-tight text-foreground`                     | Для заголовків списків/налаштувань всередині карток |
| **Заголовок картки метрики**    | `text-sm font-medium text-muted-foreground`                                  | Верхній лейбл KPI метрик                            |
| **Значення метрики KPI**        | `text-2xl font-semibold tabular-nums text-foreground @[250px]/card:text-3xl` | Чіткі моноширинні цифри                             |
| **Бейдж тренду / статусу**      | `rounded-full border px-2 py-0.5 text-xs font-medium`                        | Таблетка з відсотками/статусом                      |
| **Підвал картки метрики**       | `text-xs text-muted-foreground flex items-center gap-1.5`                    | Короткий підсумок за період                         |
| **Заголовок таблиці (TH)**      | `text-xs font-medium text-muted-foreground`                                  | Лаконічні заголовки стовпців                        |
| **Комірка таблиці (TD)**        | `text-xs sm:text-sm text-foreground`                                         | Основний текст контенту                             |
| **Поля пошуку та фільтри**      | `h-8 text-xs border-border/80 bg-background`                                 | Компактні інпути та селекти                         |
| **Кнопки дій (Actions CTA)**    | `h-8 px-3 text-xs font-medium`                                               | Кнопки створення, оновлення, експорту               |

---

## 🏁 Definition of Done (DoD)

- [x] Нуль великих банерів заголовків з іконками на сторінках Admin Portal (`/users`, `/licenses`, `/transactions`, `/navigation`, `/plans`, `/settings`) та Desktop Client (`/suppliers`, `/catalogs`, `/cloud-sync`, `/ai-enrichment`, `/plans`, `/team`, `/settings`).
- [x] Єдиний компактний `Breadcrumb` у `Header` з поточною локалізованою назвою (UK/EN) та `data-testid` у обох додатках.
- [x] Всі кнопки дій інтегровані в компактні тулбари таблиць/списків.
- [x] 100% збіг розмірів шрифтів та стилів із shadcn New York v4 `dashboard-01` (`text-2xl font-bold tracking-tight tabular-nums`, `text-xs`/`text-sm` контрастний текст).
- [x] 100% тестів `pnpm test:admin` проходять успішно (66 з 66 тестів).
- [x] 100% тестів `pnpm test:desktop` проходять успішно (93 з 93 тестів).
