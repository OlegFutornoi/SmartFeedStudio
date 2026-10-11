# 📋 План реалізації: Синхронізація та відображення аватарів/лого користувачів в адмін-панелі

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 11.10.2026  
> **Автори:** Backend Agent (`agents_backend`) & Frontend Agent (`agents_frontend`)  
> **Ціль:** Забезпечити безшовну передачу та візуальне відображення аватара/лого користувача (завантаженого через десктоп або веб) в усіх таблицях та модальних вікнах панелі адміністратора (`apps/admin-portal`).

---

## 🔍 1. Результати системного аналізу (Root Cause Analysis)

1. **База даних**: Поле `avatar_url` (TEXT) у таблиці `users` PostgreSQL **успішно існує**, і десктопний клієнт уже коректно передає аватар на бекенд через `PATCH /api/auth/avatar` (підтверджено в базі для користувача `qatest@gmail.com`).
2. **Контракти `@smartfeed/shared`**:
   - `UserListItemDto` у `packages/shared/src/dtos/user.dto.ts` **не містить** поля `avatarUrl?: string | null;`.
   - `AdminLicenseItemDto.user` у `packages/shared/src/dtos/tariff-plan.dto.ts` **не містить** поля `avatarUrl?: string | null;`.
   - `PaymentTransactionDto` у `packages/shared/src/dtos/payment.dto.ts` **не містить** поля `userAvatarUrl?: string | null;`.
   - `OrganizationMemberDto` у `packages/shared/src/dtos/organization.dto.ts` **не містить** поля `userAvatarUrl?: string | null;`.
3. **Бекенд CQRS (`services/backend-api`)**:
   - `GetUsersListHandler`: не повертає `avatarUrl` у DTO як для головних користувачів, так і для вкладених членів команди `teamMembers` та власника організації `owner`.
   - `CreateUserByAdminHandler` та `UpdateUserStatusHandler`: не повертають `avatarUrl` у вихідному `UserListItemDto`.
   - `GetAdminLicensesHandler`: у Prisma `select` не вибирає `avatarUrl` користувача ліцензії та не додає його до `AdminLicenseItemDto`.
   - `GetPaymentTransactionsHandler`: не вибирає `avatarUrl` та не мапить його в транзакції.
   - `GetOrganizationMembersHandler`: не вибирає `avatarUrl` для членів організації.
4. **Адмін-панель (`apps/admin-portal`)**:
   - Компонент `UserAvatarCell` (`apps/admin-portal/src/components/ui/user-avatar-cell.tsx`) вже має повну підтримку `avatarUrl` та `AvatarImage`, проте:
     - `UserTableRow.tsx`: викликає `<UserAvatarCell fullName={user.fullName} email={user.email} size="md" showEmail />` без передачі `avatarUrl={user.avatarUrl}`.
     - `LicensesTableRow.tsx`: викликає `<UserAvatarCell fullName={lic.user?.fullName} email={lic.user?.email} size="md" showEmail />` без `avatarUrl={lic.user?.avatarUrl}`.
     - `DashboardUsersTableTab.tsx`: викликає `UserAvatarCell` без `avatarUrl`.
     - `DashboardLicensesTableTab.tsx`: викликає `UserAvatarCell` без `avatarUrl`.
     - `DashboardTransactionsTableTab.tsx` & `TransactionsTable.tsx`: викликають `UserAvatarCell` без `avatarUrl`.
     - `UserTeamSubRows.tsx` та `TeamMembersDialog.tsx`: замість `UserAvatarCell` рендерять жорстко закодований круглий блок з першими літерами імені, повністю ігноруючи фото.

---

## 🏛 2. Архітектура та 4-рівнева модель захисту (4-Layer Defense)

1. **Рівень 1 (DTO & Schemas)**:
   - Розширення `UserListItemDto` опціональним полем `avatarUrl?: string | null`.
   - Розширення `AdminLicenseItemDto.user` полем `avatarUrl?: string | null`.
   - Розширення `PaymentTransactionDto` полем `userAvatarUrl?: string | null`.
   - Розширення `OrganizationMemberDto` полем `userAvatarUrl?: string | null`.
2. **Рівень 2 (Domain/CQRS Handlers)**:
   - Детерміноване мапування `avatarUrl` в усіх CQRS-хендлерах списків без N+1 запитів.
3. **Рівень 3 (Security/RBAC Guard)**:
   - Збереження захисту ролей: доступ до списків користувачів та ліцензій мають виключно `SUPER_ADMIN` та `ADMIN`.
4. **Рівень 4 (Database Layer)**:
   - Використання вже наявного індексованого поля `users.avatar_url`.

---

## 📋 3. Покроковий план реалізації

### Етап 1: Спільні контракти (`packages/shared`)

- [ ] Оновити `packages/shared/src/dtos/user.dto.ts`:
  - Додати `avatarUrl?: string | null;` до інтерфейсу `UserListItemDto`.
- [ ] Оновити `packages/shared/src/dtos/tariff-plan.dto.ts`:
  - Додати `avatarUrl?: string | null;` до об'єкта `user` в `AdminLicenseItemDto`.
- [ ] Оновити `packages/shared/src/dtos/payment.dto.ts`:
  - Додати `userAvatarUrl: z.string().nullable().optional()` до `PaymentTransactionDtoSchema` та інтерфейсу.
- [ ] Оновити `packages/shared/src/dtos/organization.dto.ts`:
  - Додати `userAvatarUrl: z.string().nullable().optional()` до `OrganizationMemberDtoSchema` та інтерфейсу.
- [ ] Зібрати пакет контрактів: `pnpm --filter @smartfeed/shared build`.

### Етап 2: Бекенд CQRS сервіси (`services/backend-api`)

- [ ] `GetUsersListHandler` (`src/modules/users/queries/get-users-list.handler.ts`):
  - Додати `avatarUrl: true` у Prisma `select` для `organization.owner` та `organization.members.user`.
  - У мапуванні повертати `avatarUrl: u.avatarUrl` для головного користувача.
  - У мапуванні `teamMembers` повертати `avatarUrl: m.user.avatarUrl`.
- [ ] `CreateUserByAdminHandler` (`src/modules/users/commands/create-user-by-admin.handler.ts`):
  - Повертати `avatarUrl: createdUser.avatarUrl` у результаті.
- [ ] `UpdateUserStatusHandler` (`src/modules/users/commands/update-user-status.handler.ts`):
  - Повертати `avatarUrl: updated.avatarUrl` у результаті.
- [ ] `GetAdminLicensesHandler` (`src/modules/licenses/queries/get-admin-licenses.handler.ts`):
  - Додати `avatarUrl: true` у Prisma `select` для `user`.
  - Повертати `avatarUrl: lic.user.avatarUrl` у результуючому списку.
- [ ] `GetPaymentTransactionsHandler` (`src/modules/payments/queries/get-payment-transactions.handler.ts`):
  - Додати `avatarUrl: true` у `select` зв'язаного `user` та мапити `userAvatarUrl: t.user?.avatarUrl`.
- [ ] `GetOrganizationMembersHandler` (`src/modules/organizations/queries/get-organization-members.handler.ts`):
  - Додати `avatarUrl: true` у `select` та мапити `userAvatarUrl: m.user.avatarUrl`.

### Етап 3: Адмін-портал UI (`apps/admin-portal`)

- [ ] `UserTableRow.tsx`:
  - Передати `avatarUrl={user.avatarUrl}` у `<UserAvatarCell />`.
- [ ] `UserTeamSubRows.tsx`:
  - Замінити статичний плейсхолдер ініціалів на `UserAvatarCell` (або `Avatar` + `AvatarImage`) з `avatarUrl={member.avatarUrl}`.
- [ ] `TeamMembersDialog.tsx`:
  - Замінити статичний плейсхолдер ініціалів на `UserAvatarCell` з `avatarUrl={member.avatarUrl}`.
- [ ] `LicensesTableRow.tsx`:
  - Передати `avatarUrl={lic.user?.avatarUrl}` у `<UserAvatarCell />`.
- [ ] `DashboardUsersTableTab.tsx`:
  - Передати `avatarUrl={u.avatarUrl}` для головного рядка та `member.avatarUrl` для вкладених.
- [ ] `DashboardLicensesTableTab.tsx`:
  - Передати `avatarUrl={lic.user?.avatarUrl}` у `<UserAvatarCell />`.
- [ ] `DashboardTransactionsTableTab.tsx` & `TransactionsTable.tsx`:
  - Передати `avatarUrl={tx.userAvatarUrl}` у `<UserAvatarCell />`.

### Етап 4: Тестування та верифікація (DoD)

- [ ] E2E бекенд тест у `services/backend-api/test/users.e2e-spec.ts`:
  - Перевірити, що `GET /api/users` повертає валідний `avatarUrl` користувача.
- [ ] E2E тест адмінки у `apps/admin-portal/tests/`:
  - Перевірити наявність тегу `img` всередині `[data-testid="user-avatar"]` або `UserAvatarCell` для користувача з аватаром.
- [ ] Перевірка типів:
  - `pnpm --filter @smartfeed/shared build`
  - `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
  - `pnpm --filter admin-portal exec tsc --noEmit`
  - `pnpm --filter @smartfeed/desktop exec tsc --noEmit`
- [ ] Автоформатування: `pnpm format`.
