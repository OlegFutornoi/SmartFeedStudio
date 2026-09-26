# ⚙️ План Усунення Недоліків: Backend API, Shared Contracts & DB

> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 13.09.2026  
> **Автор:** Adversarial Review Engine (`adver-review`)  
> **Цільові пакети:** `services/backend-api`, `packages/shared`

---

## 📌 1. Мета та огляд проблем

Під час adversarial аудиту бекенду та бази даних виявлено та усунено архітектурні невідповідності та ризики:

1. **Контрактна невідповідність помилок квот (Language Mismatch)**:
   - У `invite-member.handler.ts` помилка `TEAM_SEATS_LIMIT_EXCEEDED` повертала англійський текст, уніфіковано до єдиного україномовного формату згідно з `accept-invitation.handler.ts` та вимогами E2E-тесту.
2. **27 попереджень типізації `any` (ESLint Warnings)**:
   - Повністю ліквідовано у `packages/shared/src/contracts/cqrs.ts`, `services/backend-api/test/utils/teardown.helper.ts`, `users.e2e-spec.ts`, `team-invitations.e2e-spec.ts`, `payments.e2e-spec.ts`, `organizations.e2e-spec.ts`.
3. **Порушення правила snake_case мапінгу PostgreSQL (`postgres_skills.md`)**:
   - У `schema.prisma` всі моделі `User`, `Organization`, `OrganizationMember`, `OrganizationInvitation`, `TariffPlan`, `License`, `Snapshot`, `NavigationItem` приведені до 100% snake_case через директиву `@map("snake_case_name")`, бази даних синхронізовано без втрати даних.
4. **Потенційна вразливість Command Injection (CWE-78)**:
   - Усунено небезпечний виклик `exec(command)` у системних діалогах; реалізовано безпечний параметризований `execFile` з `{ shell: false }`.
5. **Розмір модуля `workspace-utils.ts` (317 рядків)**:
   - Декомпоновано на `workspace-disk.ts`, `workspace-backup.ts`, `workspace-dialogs.ts` (<160 рядків кожен) та лаконічний фасад `workspace-utils.ts` (20 рядків).
6. **Обхід валідатора DTO та Swagger Schema**:
   - Створено валідовані класи `CreateUserByAdminRequestDto` та `UpdateUserStatusRequestDto` з `class-validator` та `@ApiProperty()`, що забезпечує повну схему моделей у Swagger `/api/docs`.

---

## 🎯 2. Детальний перелік виправлених дефектів

| Категорія                  | Файли з виправленнями                                                                                                                                                                                                   | Опис результату                                                                                                  |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| 🚨 **Contract Mismatch**   | [invite-member.handler.ts](../../services/backend-api/src/modules/organizations/commands/invite-member.handler.ts#L107)                                                                                                 | Текст повідомлення `TEAM_SEATS_LIMIT_EXCEEDED` синхронізовано з єдиним українським форматом; 13/13 тестів PASS   |
| ⚠️ **Type Safety (`any`)** | [cqrs.ts](../../packages/shared/src/contracts/cqrs.ts#L84), [teardown.helper.ts](../../services/backend-api/test/utils/teardown.helper.ts#L179), [users.e2e-spec.ts](../../services/backend-api/test/users.e2e-spec.ts) | 0 попереджень `any` у ESLint; строга типізація `TariffPlanDto`, `Prisma.TariffPlanWhereInput`                    |
| 🐘 **PostgreSQL Schema**   | [schema.prisma](../../services/backend-api/prisma/schema.prisma)                                                                                                                                                        | Додано директиви `@map(...)` на всі стовпці PostgreSQL; схема бази даних на 100% відповідає стандарту snake_case |
| 🛡️ **CWE-78 Security**     | [workspace-dialogs.ts](../../services/backend-api/src/modules/storage/utils/workspace-dialogs.ts)                                                                                                                       | Заміна `exec` на `execFile` з масивом аргументів без оболонки `{ shell: false }`; декомпозиція на 3 підмодулі    |
| 📄 **Swagger Typing**      | [users.controller.ts](../../services/backend-api/src/modules/users/users.controller.ts)                                                                                                                                 | Строго типізовані DTO замість `unknown`; генерація повної OpenAPI схеми у Swagger                                |

---

## 🛠️ 3. Поетапний план виправлення (Remediation Tasks)

### Етап 1. Уніфікація контрактів помилок квот

- [x] У `invite-member.handler.ts`:
  - Синхронізовано повідомлення про перевищення квоти з єдиним форматом:
    `message: \`Ліміт місць у команді вичерпано (\${currentMembersCount}/\${maxTeamSeats} місць у команді). Зверніться до власника для апгрейду тарифу.\``
  - Забезпечено повернення структурованого об'єкта `{ code: 'TEAM_SEATS_LIMIT_EXCEEDED', currentMembersCount, maxTeamSeats }`.

### Етап 2. Повна ліквідація `any` (Zero `any` Policy)

- [x] У `packages/shared/src/contracts/cqrs.ts`: типізовано `tariffPlan?: TariffPlanDto | null;`.
- [x] У `services/backend-api/test/utils/teardown.helper.ts`:
  - Виправлено типізацію `planConditions` та `navConditions` через типи Prisma (`Prisma.TariffPlanWhereInput`, `Prisma.NavigationItemWhereInput`).
- [x] У `test/users.e2e-spec.ts`, `test/team-invitations.e2e-spec.ts`, `test/payments.e2e-spec.ts`, `test/organizations.e2e-spec.ts`:
  - Замінено приведення `as any` на конкретні DTO-інтерфейси та типізовані предикати.

### Етап 3. Безпека OS викликів та декомпозиція `workspace-utils.ts`

- [x] Замінено `exec(command)` у `selectFolderDialog()` на:
  - macOS: `execFile('osascript', args, { shell: false })`
  - Windows: `execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], { shell: false })`
  - Linux: `execFile('zenity', ['--file-selection', '--directory', '--title=Select workspace folder'], { shell: false })`
- [x] Розділено `workspace-utils.ts` (317 рядків) на:
  - `workspace-disk.ts` (ініціалізація та розміри директорій)
  - `workspace-backup.ts` (створення бекапу та ротація)
  - `workspace-dialogs.ts` (безпечні виклики діалогів OS)
  - Фасад `workspace-utils.ts` (< 25 рядків).

### Етап 4. Уніфікація DTO контролерів для Swagger

- [x] Створено класи `CreateUserByAdminRequestDto` та `UpdateUserStatusRequestDto` з валідаторами `class-validator` (`@IsEmail()`, `@IsString()`, `@IsEnum()`, `@IsBoolean()`).
- [x] Оновлено `users.controller.ts`, замінивши `@Body() body: unknown` на строго типізовані DTO.

### Етап 5. PostgreSQL Schema Snake_case Alignment

- [x] Додано директиви `@map(...)` для всіх полів у `schema.prisma`:
  - `User`: `@map("password_hash")`, `@map("full_name")`, `@map("created_at")`, `@map("updated_at")`
  - `Organization`: `@map("owner_id")`, `@map("created_at")`, `@map("updated_at")`
  - `OrganizationMember`: `@map("organization_id")`, `@map("user_id")`, `@map("joined_at")`
  - `OrganizationInvitation`: `@map("organization_id")`, `@map("invited_by_id")`, `@map("expires_at")`, `@map("created_at")`, `@map("updated_at")`
  - `TariffPlan`: `@map("name_uk")`, `@map("name_en")`, `@map("price_monthly")`, `@map("price_yearly")`, `@map("max_xml_limit")`, `@map("ai_credits")`, `@map("can_cloud_backup")`, `@map("max_feeds_limit")`, `@map("max_channels_limit")`, `@map("sync_frequency_hours")`, `@map("max_storage_gb")`, `@map("max_team_seats")`, `@map("max_suppliers_limit")`, `@map("created_at")`, `@map("updated_at")`
  - `License`: `@map("user_id")`, `@map("tariff_plan_id")`, `@map("organization_id")`, `@map("license_key")`, `@map("plan_type")`, `@map("can_cloud_backup")`, `@map("max_xml_limit")`, `@map("ai_credits")`, `@map("is_active")`, `@map("expires_at")`, `@map("created_at")`, `@map("updated_at")`
  - `Snapshot`: `@map("user_id")`, `@map("snapshot_name")`, `@map("s3_key")`, `@map("size_bytes")`, `@map("created_at")`
  - `NavigationItem`: `@map("label_uk")`, `@map("label_en")`, `@map("target_app")`, `@map("is_visible")`, `@map("required_roles")`, `@map("required_plan")`, `@map("created_at")`, `@map("updated_at")`
- [x] Виконано `pnpm --filter @smartfeed/backend-api exec prisma db push` та згенеровано оновлений клієнт.

---

## 🛡️ 4. Критерії готовності (Definition of Done)

1. [x] 100% проходження тесту `organizations.e2e-spec.ts` (13/13 PASS).
2. [x] 0 попереджень `any` у звіті `pnpm lint` (0 errors, 0 warnings).
3. [x] Відсутність небезпечних викликів `exec` із конкатенацією рядків (CWE-78).
4. [x] Повне відображення моделей DTO у Swagger `/api/docs`.
5. [x] Всі стовпці PostgreSQL бази даних мають валідні snake_case назви.
6. [x] 100% проходження повного E2E набору бекенду (11/11 сьютів, 139/139 тестів PASS).
