# 🧩 Installed UI Components Registry (`apps/desktop`)

> **Правило:** Базові UI-примітиви **НІКОЛИ не пишуться вручну з нуля**. Вони встановлюються виключно через офіційний shadcn CLI (`npx shadcn@latest add <component> -y`) або shadcn MCP. Після встановлення компонент обов'язково вноситься до цього реєстру.

---

## 📦 Офіційні shadcn/ui примітиви (встановлені через CLI)

| Компонент          | Файл                | Пакет Radix / Залежності        | Опис                                       |
| :----------------- | :------------------ | :------------------------------ | :----------------------------------------- |
| **`Alert`**        | `alert.tsx`         | `class-variance-authority`      | Банери сповіщень та помилок                |
| **`Avatar`**       | `avatar.tsx`        | `@radix-ui/react-avatar`        | Аватари користувачів з fallback ініціалами |
| **`Badge`**        | `badge.tsx`         | `class-variance-authority`      | Інформаційні та статусні бейджі            |
| **`Breadcrumb`**   | `breadcrumb.tsx`    | `@radix-ui/react-slot`          | Хлібні крихти навігації                    |
| **`Button`**       | `button.tsx`        | `@radix-ui/react-slot`, `cva`   | Кнопки зі стандартними варіантами теми     |
| **`Card`**         | `card.tsx`          | React                           | Контейнери карток (Header, Title, Content) |
| **`Chart`**        | `chart.tsx`         | `recharts`                      | Recharts-обгортки з підтримкою CSS-тонів   |
| **`Dialog`**       | `dialog.tsx`        | `@radix-ui/react-dialog`        | Модальні вікна з 100% Solid Sticky Headers |
| **`DropdownMenu`** | `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | Контекстні та випадаючі меню               |
| **`Input`**        | `input.tsx`         | React                           | Поля вводу тексту                          |
| **`Label`**        | `label.tsx`         | `@radix-ui/react-label`         | Доступні мітки для форм                    |
| **`Progress`**     | `progress.tsx`      | `@radix-ui/react-progress`      | Прогрес-бари квот та завантажень           |
| **`ScrollArea`**   | `scroll-area.tsx`   | `@radix-ui/react-scroll-area`   | Області прокрутки зі стилізованим скролом  |
| **`Select`**       | `select.tsx`        | `@radix-ui/react-select`        | Селектори з пошуком та опціями             |
| **`Separator`**    | `separator.tsx`     | `@radix-ui/react-separator`     | Розділювачі секцій                         |
| **`Skeleton`**     | `skeleton.tsx`      | React                           | Пульсуючі заглушки для стану завантаження  |
| **`Switch`**       | `switch.tsx`        | `@radix-ui/react-switch`        | Перемикачі тумблерного типу                |
| **`Table`**        | `table.tsx`         | React                           | Таблиці з компактними клітинками `text-xs` |
| **`Tabs`**         | `tabs.tsx`          | `@radix-ui/react-tabs`          | Вкладки перемикання категорій/режимів      |
| **`Tooltip`**      | `tooltip.tsx`       | `@radix-ui/react-tooltip`       | Спливаючі підказки                         |

---

## 🎨 Спеціалізовані композитні компоненти SmartFeed Studio

| Компонент                   | Файл                        | Опис                                                           |
| :-------------------------- | :-------------------------- | :------------------------------------------------------------- |
| **`UserAvatarCell`**        | `user-avatar-cell.tsx`      | Канонічна клітинка клієнта/користувача з фото/ініціалами       |
| **`StatusBadge`**           | `status-badge.tsx`          | Канонічний семантичний бейдж статусу (Emerald/Amber/Red/Muted) |
| **`DataTableViewOptions`**  | `DataTableViewOptions.tsx`  | Випадаюче меню "Налаштувати колонки" (Customize Columns)       |
| **`DataTableColumnHeader`** | `DataTableColumnHeader.tsx` | Заголовок колонки з сортуванням                                |
| **`TablePagination`**       | `table-pagination.tsx`      | Нижня пагінація з вибором розміру сторінки                     |
| **`ConfirmDeleteDialog`**   | `ConfirmDeleteDialog.tsx`   | Діалог підтвердження небезпечного видалення                    |
| **`QuotaUsageBadge`**       | `QuotaUsageBadge.tsx`       | Компактний бейдж використання квоти                            |
| **`QuotaMetricCard`**       | `QuotaMetricCard.tsx`       | Картка метрики квоти з вбудованим прогрес-баром                |
| **`QuotaExcessBanner`**     | `QuotaExcessBanner.tsx`     | Банер попередження про вичерпання лімітів тарифу               |
| **`QuotaExceededDialog`**   | `QuotaExceededDialog.tsx`   | Модальне вікно переходу на вищий тариф при оверліміті          |
| **`GlobalJobProgressBar`**  | `GlobalJobProgressBar.tsx`  | Глобальний індикатор виконання фонових черг BullMQ             |
| **`LanguageToggle`**        | `language-toggle.tsx`       | Перемикач мови UA ⇄ EN                                         |
| **`ThemeToggle`**           | `theme-toggle.tsx`          | Перемикач теми Світла / Темна / Системна                       |
| **`ErrorBoundary`**         | `ErrorBoundary.tsx`         | Запобіжник від краху інтерфейсу                                |

---

## 🚀 Як додавати нові компоненти

1. Перевірити, чи компонент уже є в цій таблиці.
2. Якщо потрібен новий офіційний примітив (наприклад `popover`, `switch`, `slider`, `sheet`):
   ```bash
   cd apps/desktop
   npx shadcn@latest add <component_name> -y
   ```
3. Додати новий компонент до таблиці вище із зазначенням файлу та Radix-залежності.
4. Заборонено писати базові HTML-заглушки чи власні реалізації Radix-примітивів вручну.
