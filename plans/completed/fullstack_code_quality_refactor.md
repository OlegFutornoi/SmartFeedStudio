# 🛠️ План усунення недоліків коду: Full-Stack Code Quality Refactoring

> **Статус:** ✅ **Реалізовано та верифіковано (100% перевірок типізації та лінтингу пройдено)**  
> **Дата виконання:** 06.09.2026  
> **Фокус:** Чистота архітектури, усунення антипатернів, модульність, типізація, обробка помилок (без тестів).

---

## 🧭 1. Зміст та цілі рефакторингу

На основі детального статичного аудиту виявлено та усунено критичні та помірні недоліки якості коду:

1. **Frontend God-Object & Silent Error Swallowing**:
   - `apps/desktop/src/lib/api.ts`: замінено всі 31 порожні блоки `catch {}` на структуроване логування `console.warn` з контекстом.
   - Усунено примусові приведення до `any` (`Promise<any>`, `(member as any)`, `(organization as any)`), впроваджено строгі типи з `@smartfeed/shared`.
2. **Монолітні UI-компоненти (>500 рядків)**:
   - `apps/desktop/src/pages/CatalogsPage.tsx` декомпозовано з 502 рядків до 256 рядків шляхом винесення `ConnectedFeedsList.tsx`.
   - `apps/desktop/src/components/feeds/ImportFeedWizardDialog.tsx` декомпозовано з 524 рядків до 365 рядків шляхом винесення `WizardDialogHeader.tsx` та `WizardDialogFooter.tsx`.
3. **Backend Defense-in-Depth & Валідація**:
   - У `workspace-utils.ts` ліквідовано небезпечний виклик `exec` з конкатенацією рядків (CWE-78 Command Injection), замінено на безпечний `execFile` з масивом аргументів без виклику командної оболонки.
   - `LicensesController`: додано `class-validator` валідацію (`SelectTariffPlanDto`, `UpgradeLicenseDto`, `AssignLicenseDto`), захистивши API від передачі некоректних даних крізь `ValidationPipe({ whitelist: true })`.
   - Видалено дублюючий ендпоінт зміни пароля з `UsersController` на користь канонічного `AuthController` (`/auth/change-password`).
   - Усунено небезпечні приведення до `any` в обробниках NestJS CQRS (`get-license-by-user-id`, `invite-member`, `update-payment-settings`, `update-user-status`, `get-users-list`, `handle-wayforpay-webhook`).
4. **Порушення 100% i18n у коді**:
   - Усунено захардкоджені локалізовані рядки з бекенду (переведено на стандартні системні описи англійською мовою з кодами помилок).

---

## 📋 2. Результати робіт по треках

### 🚀 Трек 1: Backend Architecture, Security & 4-Layer Defense

- [x] **1.1. Закрито вразливість Command Injection у `workspace-utils.ts`**:
  - Замінено небезпечний виклик `exec(\`open "${resolved}"\`)`на безпечний`execFile` з масивом аргументів без виклику оболонки (no shell interpolation).
- [x] **1.2. Додано валідовані DTO та типізацію у `LicensesController`**:
  - Створено `SelectPlanDto` з валідацією `@IsString()`, `@IsEnum()`.
  - Додано `@IsEnum(PlanType)` та `@IsNotEmpty()` до `UpgradeLicenseDto` та `AssignLicenseDto`.
- [x] **1.3. Усунуто дублюючий ендпоінт зміни пароля**:
  - Видалено зайвий `@Post('change-password')` з `UsersController` (залишено єдине канонічне місце в `AuthController` `/auth/change-password`).
- [x] **1.4. Усунуто хардкод повідомлень у бекенд-обробниках**:
  - У `invite-member.handler.ts` та `workspace-utils.ts` замінено українські рядки на стандартизовані коди помилок та англомовні описи.
- [x] **1.5. Усунуто приведення до `any` у бекенд-обробниках**:
  - `get-license-by-user-id.handler.ts`: типізовано об'єкт без `(license as any)`.
  - `update-payment-settings.handler.ts`: використано Prisma `PaymentProvider` замість `as any`.
  - `update-user-status.handler.ts`: використано `PlanType` з `@smartfeed/shared`.
  - `get-users-list.handler.ts`: видалено приведення `(primaryMembership?.organization?.owner as any)`.
  - `handle-wayforpay-webhook.handler.ts`: використано `Prisma.InputJsonValue`.

---

### 💻 Трек 2: Frontend Desktop Hardening & Modularization

- [x] **2.1. Ліквідовано порожні блоки `catch {}` у `apps/desktop/src/lib/api.ts`**:
  - Замінено всі 31 `catch {}` на структуроване логування `console.warn('[ApiClient:module] Request failed, falling back to local storage:', err)`.
  - Замінено захардкоджені повідомлення на уніфіковані англійські рядки для винятків API.
- [x] **2.2. Усунуто приведення до `any` в API клієнті та сторінках**:
  - Замінено `Promise<any>` у функціях `getMyLicense`, `getTariffPlans`, `getUserOrganizations` на `LicenseEntity`, `TariffPlanDto[]`, `UserOrganizationDto[]`.
  - Виправлено типи у `InviteMemberDialog.tsx`, `RemoveMemberDialog.tsx`, `TeamMemberRow.tsx`, `TeamPage.tsx`.
- [x] **2.3. Декомпозиція монолітного `CatalogsPage.tsx` (502 рядки -> 256 рядків)**:
  - Винесено список підключених фідів, пагінацію та картки метрик в окремий компонент `ConnectedFeedsList.tsx`.
- [x] **2.4. Декомпозиція монолітного `ImportFeedWizardDialog.tsx` (524 рядки -> 365 рядків)**:
  - Винесено шапку та підвал візарду в окремі компоненти `WizardDialogHeader.tsx` та `WizardDialogFooter.tsx`.
- [x] **2.5. Усунуто ESLint помилку в `quota-reconciliation.utils.ts`**:
  - Замінено `let subtitle` на `const subtitle`.

---

### 📦 Трек 3: Shared Contracts & Code Duplication Elimination

- [x] **3.1. Додано відсутні типи у `@smartfeed/shared`**:
  - Додано `UserOrganizationDto` та схему Zod для чіткої структури організацій користувача з ролями та лімітами.
  - Додано `AssignLicenseDto` у `@smartfeed/shared`.
- [x] **3.2. Уніфіковано перевірку Tauri у `storageApi.ts`**:
  - Використано `isTauri()` з `@/lib/runtime` замість дублювання `isTauriEnvironment()`.
- [x] **3.3. Виконано повний static typecheck та auto-format**:
  - `pnpm --filter @smartfeed/shared build` (exit code 0)
  - `pnpm --filter @smartfeed/backend-api exec tsc --noEmit` (exit code 0)
  - `pnpm --filter @smartfeed/desktop exec tsc --noEmit` (exit code 0)
  - `pnpm --filter admin-portal exec tsc --noEmit` (exit code 0)
  - `pnpm lint:fix && pnpm format` (exit code 0)

---

## 🎯 Критерії успіху (Definition of Done)

1. ✅ Жодного порожнього блоку `catch {}` у проекті.
2. ✅ 0 помилок ESLint (`pnpm lint` проходить успішно).
3. ✅ 0 помилок типізації (`tsc --noEmit` повертає exit code 0 для всіх пакетів).
4. ✅ Компоненти декомпозовано на окремі ізольовані модулі.
5. ✅ Жодної вразливості Command Injection у бекенді (безпечний `execFile`).
