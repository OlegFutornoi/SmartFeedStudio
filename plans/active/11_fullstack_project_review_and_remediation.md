# 📋 План: Повний аудит монорепозиторію та усунення технічного боргу

> **Статус:** 🟡 **На погодженні (Planning & Review Phase)**  
> **Дата створення:** 06.09.2026  
> **Автор:** Full-Stack Code Review Engine

---

## 📌 Мета та огляд

Провести планове усунення дефектів, виявлених під час повної перевірки монорепозиторію **SmartFeed Studio**:

1. Стабілізація 3 Backend E2E тестових наборів (`navigation`, `licenses`, `payments`) до 100% успішності (11/11 сьютів, 139/139 тестів).
2. Виправлення 3 попереджень хуків React (`react-hooks/exhaustive-deps`) та типізація критичних `any`.
3. Синхронізація документації покриття тестів у WIKI та README.

---

## 🎯 Задачі до виконання

### Етап 1. Backend E2E Tests Remediation

- [ ] **`test/navigation.e2e-spec.ts`**: Забезпечити автономність сьюту шляхом сіду базових навігаційних записів у `beforeAll`.
- [ ] **`test/licenses.e2e-spec.ts`**: Синхронізувати очікування з діючими правилами тарифу STARTER (7 днів тріалу, 0 грн).
- [ ] **`test/payments.e2e-spec.ts`**: Додати ініціалізацію тарифних планів `GROWTH` та `PRO` у `beforeAll`, усунути 404 та `undefined` у вебхуках.

### Етап 2. Code Quality & React Hooks

- [ ] `FirstRunWorkspaceSetupDialog.tsx`: додати `customPath` у `useEffect`.
- [ ] `useCheckoutFlow.ts`: стабілізувати залежності `useEffect` для `initInvoice`.
- [ ] `TeamPage.tsx`: додати `t` у `useCallback`.

### Етап 3. Верифікація та WIKI

- [ ] Прогін `pnpm --filter @smartfeed/backend-api test:e2e` (100% pass).
- [ ] Прогін `pnpm test:desktop` та `pnpm test:admin`.
- [ ] Оновлення таблиць покриття в `services/backend-api/README.md` та `wiki/`.
