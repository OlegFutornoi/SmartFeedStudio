# 📋 SmartFeed Studio — Впровадження Inset-макету та безшовного сайдбара shadcn `dashboard-01`

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено: 91/91 Desktop + 68/68 Admin)**  
> **Дата виконання:** 27.09.2026  
> **Аудитор & Архітектор:** `agents_frontend`  
> **Цільові додатки:** `apps/desktop` (Desktop Client) та `apps/admin-portal` (Admin Web Portal)  
> **Відповідність стандартам:** [`.agents/agents_frontend.md`](../../.agents/agents_frontend.md), [`.agents/rules/design_system_and_theming.md`](../../.agents/rules/design_system_and_theming.md)

---

## 🎯 1. Аналіз проблеми та візуальних розбіжностей

На скріншотах користувача зафіксовано суттєвий візуальний дефект:

1. **Перетин ліній (T-junctions & Crosses)**:
   - Сайдбар мав нижню рамку під логотипом (`border-b border-border`).
   - Головний хедер мав нижню рамку на всю ширину екрану (`border-b border-border`).
   - Вертикальний розділювач сайдбара (`border-r border-border`) перетинався з ними, утворюючи неохайний хрест із ліній.
2. **Зайві розділювачі всередині меню**:
   - Верхній напис `МЕНЮ КЛІЄНТА` з верхніми/нижніми відступами та нижній блок профілю користувача з `border-t border-border` створювали відчуття «порізаного на шматки» сайдбара.
3. **Еталон shadcn `dashboard-01` (Скріншот 1)**:
   - Використовує архітектуру **`SidebarInset`**:
     - Сайдбар ліворуч чистий, без жорстких горизонтальних ліній: логотип плавно переходить у кнопки навігації, а внизу — лаконічний профіль користувача.
     - Робоча область — це виділена плаваюча заокруглена картка (`SidebarInset`): `md:m-2 md:ml-0 md:rounded-xl md:border md:border-border/80 md:shadow-xs md:bg-background`.
     - Хедер знаходиться **всередині** цієї картки, його горизонтальна лінія ніколи не перетинається із сайдбаром!

---

## 🛠 2. Поетапний план реалізації

### Етап 1: Оновлення сайдбара Desktop (`apps/desktop/src/components/layout/`)

1. **`Sidebar.tsx`**:
   - Прибрати `border-b` з блоку логотипу (чистий `px-4 pt-4 pb-2`).
   - Додати кнопку швидкої дії `+ Додати постачальника` під логотипом у стилі "Quick Create" з `dashboard-01`.
   - Замінити важку мітку `МЕНЮ КЛІЄНТА` на чистий компактний заголовок секції без рамок.
   - Прибрати жорстку рамку `border-r border-border` між сайдбаром та робочою областю (фон сайдбара м'яко відокремлює його від inset-картки).
2. **`SidebarUserProfile.tsx`**:
   - Прибрати `border-t border-border`, оформити як чистий floating card елемент `p-3 mt-auto`.

### Етап 2: Оновлення макету Desktop (`DashboardLayout.tsx` та `Header.tsx`)

1. **`DashboardLayout.tsx`**:
   - Впровадити структуру `SidebarInset`:
     - Зовнішній контейнер: `bg-muted/30 dark:bg-card/40`.
     - Робоча область: `flex-1 flex flex-col min-w-0 md:m-2 md:ml-0 md:rounded-xl md:border md:border-border/80 md:shadow-xs bg-background overflow-hidden`.
2. **`Header.tsx`**:
   - Компактна висота `h-14` (56px) або `h-12` (48px).
   - Ліворуч: `SidebarTrigger` + вертикальний `Separator` + назва поточного розділу (Хлібні крихти).
   - Праворуч: пошук `⌘K`, зміна мови, зміна теми, бейдж ліцензії.

### Етап 3: Оновлення макету та сайдбара Admin Portal (`apps/admin-portal`)

1. **`layout.tsx`**:
   - Впровадити Inset-макет (`md:m-2 md:ml-0 md:rounded-xl md:border md:border-border/80 md:shadow-xs bg-background`).
2. **`sidebar.tsx`**:
   - Прибрати `border-b` під логотипом і `border-t` над профілем.
   - Прибрати `border-r` на користь Inset-контрасту.
3. **`header.tsx`**:
   - Компактний внутрішній хедер із `SidebarTrigger`, хлібними крихтами та системними статусами.

### Етап 4: Перевірка типізації та E2E Тестування

- `tsc --noEmit` — 0 помилок в обох додатках.
- Запуск `pnpm test:desktop` (91 тест) та `pnpm test:admin` (68 тестів) — 100% успішне проходження.

---

## 🔒 3. Протокол виконання (Strict Hold)

Згідно з регламентом [`.agents/rules/plans_lifecycle.md`](../../.agents/rules/plans_lifecycle.md) та `agents_frontend`:  
**Агент ЗУПИНЯЄТЬСЯ і НЕ розпочинає внесення змін у код до отримання явної команди користувача на виконання плану.**
