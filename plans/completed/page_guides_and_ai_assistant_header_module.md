# 📋 План реалізації: Модуль Page Guides та AI-асистент у шапці сторінок

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.10.2026  
> **Архітектура:** Модульна мікросервісна структура (NestJS CQRS + Prisma + `@smartfeed/shared` + React Desktop + Playwright)

---

## 🎯 1. Огляд та Мета

Користувач звернув увагу на ключові вимоги:

1. **Захаращення робочого простору**: статичні навчальні блоки (як у `MediaSyncTab`: _"Як працює хмарне медіасховище Cloudflare R2"_) видалені, звільняючи робочу площу під каталоги та таблиці.
2. **Єдиний принцип побудови сторінок**:
   - Назва сторінки виводиться разом із відповідною іконкою розділу.
   - Праворуч від назви розміщується інформаційна іконка `[i]`.
   - При кліку/наведенні з'являється преміальне модальне вікно із фото нашого 3D AI-асистента, де ШІ зрозуміло та дружньо пояснює призначення розділу, ключові можливості та дає корисну пораду.
3. **Централізоване фото AI-асистента (Single Source of Truth)**:
   - Фото та профіль AI-асистента винесені в єдиний конфіг/ендпоінт (`AiAssistantProfile`).
   - Якщо фото змінюється (в майбутньому через адмінку або налаштування), воно автоматично змінюється **скрізь у додатку** (у шапці, в гайдах, на віджетах автопілота `AiCopilotCard` та в блокерах).
   - При відсутності кастомного фото працює надійний локальний fallback на `ai-copilot-agent.jpg`.

---

## 🏛 2. Архітектура та 4-рівневий захист

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      SMARTFEED STUDIO ARCHITECTURE                     │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐     ┌───────────────────────────────────┐
│     services/backend-api             │     │      apps/desktop                 │
│  (PageGuidesModule CQRS)             │     │  (Header & PageHeaderGuide)       │
│  - Prisma model: `page_guides`       │◄───►│  - Hook: `usePageGuide(route)`    │
│  - Query: `GetPageGuidesQuery`       │     │  - Popover/Modal: AI Copilot info │
│  - Controller: `/api/page-guides`    │     │  - Clean layout: zero bulky cards │
└──────────────────┬───────────────────┘     └─────────────────┬─────────────────┘
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          packages/shared              │
                     │  - `PageGuideDto` Zod schema & types  │
                     │  - Canonical default offline guides   │
                     └───────────────────────────────────────┘
```

### 4-Рівнева модель захисту:

- **Рівень 1 (DTO)**: Zod валідація у `@smartfeed/shared` та `class-validator` декоратори на DTO бекенду.
- **Рівень 2 (Domain)**: Повнотекстовий паритет UA ⇄ EN, fallback-значення за замовчуванням при відсутності мережі.
- **Рівень 3 (Security/RBAC)**: Публічне або автентифіковане read-only API для клієнтів, захист від injection.
- **Рівень 4 (Database)**: Prisma моделі `PageGuide` та `AiAssistantSetting` з унікальним індексом по `route`, таймстемпами та каскадами.

---

## 📦 3. Бюджет модульності файлів (<250 рядків)

1. `packages/shared/src/dtos/page-guide.dto.ts` — Zod-схеми та TypeScript інтерфейси.
2. `services/backend-api/prisma/schema.prisma` — моделі `PageGuide` та `AiAssistantSetting`.
3. `services/backend-api/src/modules/page-guides/`:
   - `page-guides.module.ts`
   - `page-guides.controller.ts`
   - `queries/get-page-guides.handler.ts`
   - `queries/get-ai-assistant-profile.handler.ts`
   - `commands/update-ai-assistant-profile.handler.ts`
4. `apps/desktop/src/hooks/usePageGuide.ts` — реактивний хук із локальним кешем та офлайн-паритетом.
5. `apps/desktop/src/hooks/useAiAssistantProfile.ts` — централізований хук профілю та аватара AI Copilot.
6. `apps/desktop/src/components/layout/PageHeaderGuide.tsx` (~160 рядків) — інтерактивна кнопка `[i]` та модалка AI Copilot.
7. `apps/desktop/src/components/layout/Header.tsx` (оновлення шапки з іконкою та інтеграцією гайда).
8. `apps/desktop/src/components/cloud/MediaSyncTab.tsx` (видалення громіздкого блоку інтро).

---

## 🧪 4. Результати тестування (100% PASS)

1. **Backend Jest E2E**: `services/backend-api/test/page-guides.e2e-spec.ts` — **6/6 passed**
2. **Desktop Playwright E2E**: `apps/desktop/e2e/page-header-guides.spec.ts` — **4/4 passed**
3. **Desktop Storage UI E2E**: `apps/desktop/e2e/storage-ui.spec.ts` — **4/4 passed**
4. **TypeScript Strict Typecheck**:
   - `services/backend-api`: 0 errors
   - `apps/desktop`: 0 errors
   - `admin-portal`: 0 errors
   - `packages/shared`: 0 errors
