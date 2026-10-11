# 📋 План реалізації: Модуль інтерактивного бекдроп-спотлайту зі зняттям блюру для заблокованих користувачів

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 11.10.2026  
> **Автори:** Frontend Agent (`agents_frontend`) & Design Systems Lead  
> **Ціль:** Створити виділений модуль `InteractiveBlurSpotlight` (або `SpotlightBackdrop`), який при призупиненні користувача зберігає фоновий інтерфейс робочого простору під глибоким матовим блюром, але додає плавний інтерактивний ліхтарик (спотлайт), що частково розсіює блюр навколо курсора миші за зразком NexaCRM, акцентуючи увагу на центральному модальному вікні `UserSuspendedBlocker`.

---

## 🎨 1. Візуальна концепція та референс NexaCRM

За зразком шаблону NexaCRM (`shadcn-nextjs-nexacrm-app-template`):

1. **Фоновий шар (Underlay)**:
   - Реальний інтерфейс додатку (каталоги, меню, статистика або макет робочого простору) рендериться на задньому плані.
   - Повністю деактивований для кліків (`pointer-events-none`, `select-none`, `aria-hidden="true"`), щоб заблокований користувач не міг здійснювати жодних дій.
2. **Шар матового розмиття з динамічною CSS-маскою (Spotlight Mask Overlay)**:
   - Оверлей з `backdrop-blur-xl` та напівпрозорим фоном (`bg-background/70` у світлій темі, `bg-background/80` у темній).
   - Динамічна маска `mask-image: radial-gradient(circle 220px at var(--mouse-x, 50%) var(--mouse-y, 50%), transparent 0%, black 100%)` (та `-webkit-mask-image`).
   - Навколо курсора миші створюється плавна кругла зона радіусом ~180-220px, де розмиття зникає, відкриваючи чіткі графіки та таблиці робочого простору під курсором.
   - За межами кола весь екран залишається повністю розмитим і захищеним.
3. **Плавна інтерполяція та анімація курсора**:
   - `requestAnimationFrame` або плавна пружинна інтерполяція (Lerp `x += (targetX - x) * 0.15`), щоб пляма світла рухалася м'яко, органічно й тактильно без ривків.
   - Легке пульсування розмиття/світіння по контуру плями (`box-shadow` / radial tint) у стилі `emil-design-eng`.
4. **Центральне вікно блокування (Modal Layer, z-50)**:
   - Плаваюча картка `UserSuspendedBlocker` по центру екрана з чіткою тінню (`shadow-2xl`), високим z-index (`z-50`) та активними кнопками «Написати в підтримку» та «Вийти з акаунту».

---

## 🏛 2. Архітектурне проектування модуля

### Структура компонентів:

```text
apps/desktop/src/components/layout/
├── UserSuspendedBlocker.tsx            # Ізольована картка з повідомленням про блокування (<85 рядків)
├── SpotlightBlurBackdrop.tsx           # Окремий ізольований модуль трекінгу миші та спотлайт-маски (<150 рядків)
└── DashboardLayout.tsx                 # Підключення: якщо isUserSuspended, огортаємо робочу область у SpotlightBlurBackdrop
```

### Принцип роботи `SpotlightBlurBackdrop.tsx`:

```tsx
interface SpotlightBlurBackdropProps {
  children: React.ReactNode; // Модальне вікно (UserSuspendedBlocker)
  backgroundContent?: React.ReactNode; // Фоновий робочий простір для ефекту NexaCRM
}
```

1. Хук відстеження миші:
   - Слухає `onMouseMove` з пасивним обробником.
   - Зберігає цільові координати та оновлює поточні координати через `requestAnimationFrame` (60/120 FPS).
2. CSS Custom Properties:
   - Передає `--mouse-x` та `--mouse-y` у стилі маски.
3. Доступність (Accessibility):
   - Поважає `prefers-reduced-motion`: при ввімкненому системному режимі відключає анімацію трекінгу та показує статичний м'який блюр.

---

## 🛡 3. Безпека та ізоляція взаємодії

1. **Сувора заборона кліків по бекграунду**:
   - Фоновий контент має класи `pointer-events-none select-none overflow-hidden max-h-screen`.
   - Жоден запит до API чи навігація не можуть бути спровоковані кліком крізь пляму ліхтарика.
2. **Фокус-пастка (Focus Trap)**:
   - Клавіатурний тач/Tab заблоковано в межах центрального вікна `UserSuspendedBlocker` (доступні лише кнопки підтримки та виходу).

---

## 📋 4. Покроковий план реалізації

- [x] **Крок 1**: Створення окремого модуля `SpotlightBlurBackdrop.tsx` в `apps/desktop/src/components/layout/`:
  - Обчислення координат миші з плавною інтерполяцією (Lerp).
  - CSS-маска `radial-gradient` з `backdrop-blur`.
  - Монохромний підсвічувальний контур світла/тіні.
- [x] **Крок 2**: Оновлення `UserSuspendedBlocker.tsx` / `DashboardLayout.tsx`:
  - Інтеграція `SpotlightBlurBackdrop` у `DashboardLayout`: коли `isUserSuspended === true`, основний вміст рендериться всередині бекграунду зі спотлайтом, а поверх нього центрується `UserSuspendedBlocker`.
- [x] **Крок 3**: Стилізація під shadcn / `ui-ux-pro-max`:
  - 100% сумісність зі світлою та темною темами.
  - Семантичні класи `bg-background/80`, `backdrop-blur-md`, `border-border`.
- [x] **Крок 4**: Тестування Playwright E2E:
  - Доповнення `apps/desktop/e2e/user-suspended.spec.ts` перевіркою наявності спотлайт-контейнера `[data-testid="spotlight-blur-backdrop"]` та блокування кліків по фону.
- [x] **Крок 5**: Перевірка `tsc --noEmit`, `pnpm lint`, `pnpm format`.
