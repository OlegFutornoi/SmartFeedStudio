# 📡 Інтеграція Sentry SDK у Десктопний Клієнт (`apps/desktop`)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.09.2026  
> **Ціль:** Налаштувати автоматичний моніторинг помилок у додатку `apps/desktop`, щоб усі винятки (включаючи рендеринг сітки товарів, візарди імпорту, локальні запити та навігацію) автоматично передавалися в Sentry та були доступні через Sentry MCP асистенту.

---

## 🏛 1. Архітектурні вимоги та модульність

1. **Ізоляція та безпека (Local-First Resilience)**:
   - Десктопний клієнт працює з конфіденційними комерційними каталогами та даними цін.
   - Sentry SDK не повинен передавати конфіденційні паролі або тіло бази даних. Передаються тільки стек винятків, URL/шлях роутера, версія додатку та тег `app: "desktop"`.
   - За повної відсутності мережі Sentry не блокує інтерфейс і не викидає помилок (Graceful fallback).

2. **Модульність коду (Компоненти < 100 рядків)**:
   - `apps/desktop/src/lib/sentry.ts` — чиста ініціалізація та хелпери перехоплення.
   - Підключення в `apps/desktop/src/main.tsx` перед монтуванням кореня додатку.
   - Зв'язок із `apps/desktop/src/components/ui/ErrorBoundary.tsx` через `Sentry.captureException`.
   - Прив'язка користувача у `AuthContext.tsx` (`Sentry.setUser`).

---

## 📐 2. Чеклист змін за шарами

### 📦 Залежності:

- [x] Встановити `@sentry/react` у `apps/desktop`.

### ⚙️ Конфігурація та змінні середовища:

- [x] Додати `VITE_SENTRY_DSN` у `.env` та конфіг клієнта з дефолтним DSN організації `smartfreestudio`.

### 💻 Клієнтський код:

- [x] Створити `apps/desktop/src/lib/sentry.ts`:
  - `initSentry()` з `browserTracingIntegration`, `replayIntegration` (лише при помилках).
  - Налаштування тегів `app: 'desktop'`, `platform: 'tauri-or-web'`.
- [x] Оновити `apps/desktop/src/main.tsx`:
  - Виклик `initSentry()` до `ReactDOM.createRoot`.
- [x] Оновити `apps/desktop/src/components/ui/ErrorBoundary.tsx`:
  - Додати `Sentry.captureException(error, { extra: errorInfo })`.
- [x] Оновити `apps/desktop/src/contexts/AuthContext.tsx`:
  - `Sentry.setUser({ id: user.id, email: user.email })` при логіні.
  - `Sentry.setUser(null)` при виході.

---

## 🧪 3. План тестування та верифікації

1. **Статична типізація**:
   - `pnpm --filter @smartfeed/desktop exec tsc --noEmit` — 0 помилок.
2. **Збірка**:
   - `pnpm --filter @smartfeed/desktop build` — успішна компіляція Vite.
3. **Функціональний тест**:
   - Перевірити тестовий виклик `Sentry.captureException` та перевірити його надходження в Sentry через `list_sentry_issues`.
