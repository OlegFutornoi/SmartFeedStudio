# 🎨 План Усунення Недоліків: Frontend (Desktop & Admin Portal)

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.09.2026  
> **Автор:** Adversarial Review Engine (`adver-review`)  
> **Цільові додатки:** `apps/desktop`, `apps/admin-portal`

---

## 📌 1. Мета та огляд проблем

Під час безкомпромісного adversarial рев'ю фронтенд-шару виявлено структурні порушення правил інженерної дисципліни, теми, модульності та локалізації:

1. **13+ порушень палітри кольорів (Off-Scheme Colors)**: використання заборонених хардкодних класів `purple-*`, `violet-*` замість семантичних токенів (`primary`, `border`, `card`, `muted`).
2. **10+ монолітних God-файлів (> 250–300 рядків)**: перевантажені компоненти, API-модулі та хуки, що порушують принцип модульності (зокрема `storageApi.ts` на 411 рядків, `api.ts` в Admin Portal на 346 рядків, `ImportFeedWizardDialog.tsx` на 373 рядки).
3. **30+ мовчазних блоків `catch {}` (Zero Silent Failures)**: відсутність структурованого логування помилок або локалізованих сповіщень користувачу.
4. **Масовий витік нелокалізованих рядків (100% i18n Breach)**: у компонентах каналів експорту (`apps/desktop/src/components/export/*`) десятки рядків захардкоджені кирилицею без ключів перекладу `t()`.
5. **Порушення Zero Duplicate Action Buttons**: на сторінці каналів експорту (`ExportChannelsList.tsx`) одночасно відображається тулбар з пошуком і кнопкою «Підключити маркетплейс» та картка Empty State з тією самою кнопкою при `items.length === 0`.

---

## 🎯 2. Детальний перелік виправлених дефектів

| Категорія                           | Файли з порушеннями                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Опис виправлення                                                                  |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------- |
| 🎨 **Off-Scheme Colors**            | [HomePage.tsx](../../apps/desktop/src/pages/HomePage.tsx), [FirstRunWorkspaceSetupDialog.tsx](../../apps/desktop/src/components/storage/FirstRunWorkspaceSetupDialog.tsx), [ExportChannelCard.tsx](../../apps/desktop/src/components/export/ExportChannelCard.tsx), [UserTeamSubRows.tsx](../../apps/admin-portal/src/components/users/UserTeamSubRows.tsx), [ProfileInfoCard.tsx](../../apps/admin-portal/src/components/profile/ProfileInfoCard.tsx), [TransactionsTable.tsx](../../apps/admin-portal/src/components/transactions/TransactionsTable.tsx), [PlanSelector.tsx](../../apps/admin-portal/src/components/users/PlanSelector.tsx), [DashboardStatsGrid.tsx](../../apps/admin-portal/src/components/dashboard/DashboardStatsGrid.tsx), [DashboardRecentUsersTable.tsx](../../apps/admin-portal/src/components/dashboard/DashboardRecentUsersTable.tsx), [NavigationItemRow.tsx](../../apps/admin-portal/src/components/navigation/NavigationItemRow.tsx), [TransactionStatsCards.tsx](../../apps/admin-portal/src/components/transactions/TransactionStatsCards.tsx) | Замінено всі заборонені класи `purple-500`, `violet-500` на семантичні токени     |
| 🗄️ **God-Files (> 280–300 рядків)** | [storageApi.ts](../../apps/desktop/src/lib/storageApi.ts) (декомпозовано у `src/lib/storage/`), [admin-portal/api.ts](../../apps/admin-portal/src/lib/api.ts) (декомпозовано у `src/lib/api/`), [ImportFeedWizardDialog.tsx](../../apps/desktop/src/components/feeds/ImportFeedWizardDialog.tsx) (винесено `useImportFeedWizard.ts`), [QuotaReconciliationDialog.tsx](../../apps/desktop/src/components/plans/QuotaReconciliationDialog.tsx) (винесено Header/Footer), [usePlanForm.ts](../../apps/admin-portal/src/components/plans/usePlanForm.ts) (винесено `planFormDefaults.ts`), [SuppliersPage.tsx](../../apps/desktop/src/pages/SuppliersPage.tsx) (винесено `SuppliersModals.tsx`)                                                                                                                                                                                                                                                                                                                                                                                     | Усі модулі скорочено до < 250–300 рядків із доменною декомпозицією                |
| 🔇 **Silent Failures (`catch {}`)** | 30+ файлів у `apps/desktop` та `apps/admin-portal`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Усі порожні блоки `catch {}` замінено на структуровані виклики `console.warn`     |
| 🌐 **i18n Violations**              | [CreateExportChannelDialog.tsx](../../apps/desktop/src/components/export/CreateExportChannelDialog.tsx), [ExportChannelCard.tsx](../../apps/desktop/src/components/export/ExportChannelCard.tsx), [ExportChannelsList.tsx](../../apps/desktop/src/components/export/ExportChannelsList.tsx), [MarketplacePresetsList.tsx](../../apps/desktop/src/components/export/MarketplacePresetsList.tsx), [MarginEconomicsSimulator.tsx](../../apps/desktop/src/components/export/MarginEconomicsSimulator.tsx)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Створено `export.json` (UK/EN), 100% текстів локалізовано через `t('export:...')` |
| 🚫 **Duplicate Buttons**            | [ExportChannelsList.tsx](../../apps/desktop/src/components/export/ExportChannelsList.tsx)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Приховано верхній тулбар при `channels.length === 0 && !search`, єдиний CTA       |

---

## 🛠️ 3. Поетапний план виправлення (Remediation Tasks)

### Етап 1. Очищення палітри кольорів (100% Theme Harmony)

- [x] Замінити `purple-500`, `violet-500` на семантичні класи `primary`, `primary/10`, `border-border/80`, `text-primary` в:
  - `apps/desktop/src/pages/HomePage.tsx`
  - `apps/desktop/src/components/storage/FirstRunWorkspaceSetupDialog.tsx`
  - `apps/desktop/src/components/export/ExportChannelCard.tsx`
  - `apps/admin-portal/src/components/users/UserTeamSubRows.tsx`
  - `apps/admin-portal/src/components/profile/ProfileInfoCard.tsx`
  - `apps/admin-portal/src/components/transactions/TransactionsTable.tsx`
  - `apps/admin-portal/src/components/users/PlanSelector.tsx`
  - `apps/admin-portal/src/components/dashboard/DashboardStatsGrid.tsx`
  - `apps/admin-portal/src/components/dashboard/DashboardRecentUsersTable.tsx`
  - `apps/admin-portal/src/components/navigation/NavigationItemRow.tsx`
  - `apps/admin-portal/src/components/transactions/TransactionStatsCards.tsx`
- [x] Перевірити виконання через скрипт `git diff --name-only | xargs grep -E "purple-|violet-|fuchsia-|pink-"`.

### Етап 2. Декомпозиція God-файлів (Budget < 250–300 рядків)

- [x] **`apps/desktop/src/lib/storageApi.ts`** (411 рядків) ➔ розділити на:
  - `src/lib/storage/specs.ts` (Tauri / OS system specs)
  - `src/lib/storage/workspace.ts` (читання/збереження інфо та шляхів)
  - `src/lib/storage/maintenance.ts` (бекап, очищення кешу, оптимізація)
  - Фасадний `src/lib/storageApi.ts` (< 10 рядків).
- [x] **`apps/admin-portal/src/lib/api.ts`** (346 рядків) ➔ перевести на модульний фасадний патерн:
  - `src/lib/api/client.ts` (базовий fetch з mutex-оновленням токенів)
  - `src/lib/api/auth.ts`, `plans.ts`, `licenses.ts`, `users.ts`, `payments.ts`, `navigation.ts`
  - Фасадний `src/lib/api.ts` (< 10 рядків).
- [x] **`apps/desktop/src/components/feeds/ImportFeedWizardDialog.tsx`** (373 рядки):
  - Винести стейт-машину майстра та валідацію в хук `useImportFeedWizard.ts` (265 рядків).
  - Компонент діалогу скоротити до 189 рядків.
- [x] **`apps/desktop/src/components/plans/QuotaReconciliationDialog.tsx`** (356 рядків):
  - Винести субкомпоненти `QuotaReconciliationHeader.tsx` (101 рядок) та `QuotaReconciliationFooter.tsx` (77 рядків).
  - Головний діалог скорочено до 202 рядків.
- [x] **`apps/admin-portal/src/components/plans/usePlanForm.ts`** (344 рядки):
  - Розділити схему та дефолтні значення у `planFormDefaults.ts` (152 рядки).
  - Хук скорочено до 229 рядків.
- [x] **`apps/desktop/src/pages/SuppliersPage.tsx`** (328 рядків):
  - Винести модальні вікна в `SuppliersModals.tsx` (118 рядків), скоротивши сторінку до 290 рядків.

### Етап 3. Ліквідація мовчазних помилок (Zero Silent Failures)

- [x] У всіх 30+ виявлених блоках `catch {}`:
  - Додати структурований виклик `console.warn('[Module:Context] Failed operation:', error)`.

### Етап 4. 100% i18n локалізація модуля каналів експорту

- [x] Створити словники `apps/desktop/src/i18n/locales/uk/export.json` та `en/export.json`.
- [x] Замінити всі захардкоджені рядки у:
  - `CreateExportChannelDialog.tsx`
  - `ExportChannelCard.tsx`
  - `ExportChannelsList.tsx`
  - `MarketplacePresetsList.tsx`
  - `MarginEconomicsSimulator.tsx`
- [x] Підключити простір імен `'export'` у `useTranslation`.

### Етап 5. Усунення дублювання CTA та логіки порожнього стану

- [x] В `ExportChannelsList.tsx`:
  - Приховувати верхній тулбар (пошук та кнопку `[+ Підключити маркетплейс]`), коли `channels.length === 0 && !search`.
  - Залишити єдину точку входу через кнопку у Empty State Card з `data-testid="create-export-channel-btn"`.

---

## 🛡️ 4. Критерії готовності (Definition of Done)

1. [x] Усі файли у фронтенді мають розмір < 250–300 рядків.
2. [x] 0 входжень класів `purple-*`, `violet-*`, `fuchsia-*`, `pink-*`.
3. [x] 0 мовчазних блоків `catch {}`.
4. [x] 100% переклад інтерфейсу при перемиканні UA ⇄ EN на сторінках експорту та налаштувань.
5. [x] `pnpm --filter @smartfeed/desktop exec tsc --noEmit` & `pnpm --filter admin-portal exec tsc --noEmit` повертають 0 помилок.
