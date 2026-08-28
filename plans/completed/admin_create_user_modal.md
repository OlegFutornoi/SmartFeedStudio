> **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
> **Дата виконання:** 27.08.2026

# 👤 План: Створення користувача в Admin Portal (усі ролі: Admin, Owner, Member, Solo)

## 📌 Опис та мета

Реалізувати можливість повноцінного створення користувачів безпосередньо з панелі адміністратора на сторінці `/users` з витонченим, лаконічним дизайном (у стилі shadcn/ui та загальної дизайн-системи платформи).

Користувач зможе створити:

1. **Адміністратора платформи** (`SUPER_ADMIN` або `ADMIN`).
2. **Головного користувача (Власника компанії / Owner)** (`USER` зі створенням власної компанії та вибором стартового тарифного плану).
3. **Запрошеного співробітника (Member)** (`USER` з прикріпленням до обраної існуючої компанії/організації зі списку власників).
4. **Solo-користувача (Індивідуальний)** (`USER` без організації).

Кнопка відкриття модального вікна розташовується у правому куті тулбара картки користувачів — поруч із кнопкою оновлення (відповідно до червоного маркеру на скріншоті користувача).

---

## 🏗️ Архітектура та етапи реалізації

### 1. Shared DTOs (`packages/shared`)

- **`packages/shared/src/dtos/user.dto.ts`**:
  - Додати схему валідації `CreateUserByAdminDtoSchema` та тип `CreateUserByAdminDto`:
    ```typescript
    export const CreateUserByAdminDtoSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      fullName: z.string().min(2),
      role: z.nativeEnum(Role).default(Role.USER),
      accountType: z.enum(['ADMIN', 'OWNER', 'MEMBER', 'SOLO']).default('SOLO'),
      companyName: z.string().optional(),
      organizationId: z.string().optional(),
      planCode: z.string().optional(), // 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE'
    });
    ```
  - Перезібрати спільний пакет: `pnpm --filter @smartfeed/shared build`.

### 2. Бекенд CQRS (`services/backend-api`)

- **Команда та обробник (`services/backend-api/src/modules/users/commands/`)**:
  - Створити `create-user-by-admin.command.ts`
  - Створити `create-user-by-admin.handler.ts`:
    - Перевірка унікальності email (`ConflictException` при дублікаті).
    - Хешування паролю через `bcrypt` (10 раундів).
    - Створення запису `User` у БД через Prisma.
    - Обробка типу акаунта:
      - `OWNER`: Створення `Organization` (з назвою `companyName` або дефолтною) та `OrganizationMember` з `role: 'OWNER'`.
      - `MEMBER`: Перевірка існування `organizationId` та додавання в `OrganizationMember` з `role: 'MEMBER'`.
      - `SOLO` / `ADMIN`: Організація не створюється.
    - Створення ліцензії для клієнтських акаунтів (`Role.USER`): підв'язка обраного `TariffPlan` (STARTER / GROWTH / PRO / ENTERPRISE) з генерацією ліцензійного ключа `SF-{PLAN}-{XXXX}-{XXXX}-{XXXX}`.
    - Повернення сформованого об'єкта `UserListItemDto`.
- **Контролер (`users.controller.ts`)**:
  - Додати ендпоінт `POST /users`:
    - Захищено `@UseGuards(RolesGuard)` та `@Roles(Role.SUPER_ADMIN, Role.ADMIN)`.
    - Виклик `this.commandBus.execute(new CreateUserByAdminCommand(dto))`.
- **Тестування бекенду**:
  - Додати E2E тести в `services/backend-api/test/users.e2e-spec.ts` для перевірки всіх 4 сценаріїв створення з повною очисткою через `cleanDatabase`.

### 3. Фронтенд Admin Portal (`apps/admin-portal`)

- **API клієнт (`apps/admin-portal/src/lib/api.ts`)**:
  - Додати метод `createUser(dto: CreateUserByAdminDto): Promise<UserListItemDto>`.
- **Кнопка відкриття модального вікна (`UsersTableToolbar.tsx`)**:
  - Додати кнопку `<Button data-testid="open-create-user-dialog-btn" ...>` праворуч від кнопки оновлення:
    ```tsx
    <Button
      size="sm"
      data-testid="open-create-user-dialog-btn"
      onClick={onOpenCreateUser}
      className="h-8 gap-1.5 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium shadow-sm transition-all"
    >
      <UserPlus className="size-3.5" />
      <span>{t('users', 'create_user_button')}</span>
    </Button>
    ```
- **Модальне вікно створення користувача (`CreateUserDialog.tsx`)**:
  - Розташування: `apps/admin-portal/src/components/users/CreateUserDialog.tsx`.
  - Лаконічний дизайн відповідно до shadcn/ui:
    - Заголовок з іконкою `UserPlus`.
    - Блок основних даних: `Ім'я`, `Email`, `Пароль` (з кнопкою генерації надійного паролю та показу/приховування).
    - Перемикач системної ролі: `Користувач (USER)`, `Адміністратор (ADMIN)`, `Суперадмін (SUPER_ADMIN)`.
    - Якщо обрано `USER` — інтерактивний блок вибору структури акаунта:
      - 👑 **Власник компанії (`OWNER`)**: поле введення назви організації/компанії.
      - 👥 **Запрошений співробітник (`MEMBER`)**: випадаючий список вибору існуючої компанії/власника (завантажується через `api.getUsers({ orgRoleFilter: 'OWNERS' })`).
      - 👤 **Solo-користувач (`SOLO`)**: без організації.
      - 💎 **Тарифний план**: вибір плану ліцензії (Starter, Growth, Pro, Enterprise).
    - Кнопки дій: «Скасувати» та «Створити користувача» з індикатором завантаження.
- **Інтеграція в сторінку (`apps/admin-portal/src/app/(dashboard)/users/page.tsx`)**:
  - Керування відкриттям/закриттям діалогу, перезавантаження списку після успішного створення, сповіщення про успіх.
- **Локалізація (i18n)**:
  - 100% ключів у `locales/uk/users.json` та `locales/en/users.json`.

---

## 🧪 План тестування та верифікації

1. **Типізація**:
   - `pnpm --filter @smartfeed/shared build`
   - `pnpm --filter @smartfeed/backend-api exec tsc --noEmit`
   - `pnpm --filter admin-portal exec tsc --noEmit`
2. **Backend Jest E2E**:
   - `pnpm --filter @smartfeed/backend-api test:e2e` (перевірка `POST /users` для Admin, Owner, Member, Solo, валідації та teardown).
3. **Playwright E2E (`admin-portal`)**:
   - Додати тести в `apps/admin-portal/e2e/users.spec.ts`:
     - Відкриття модального вікна по кнопці з тулбара.
     - Створення адміністратора (`ADMIN`).
     - Створення власника компанії (`OWNER`) з назвою фірми та перевірка бейджа в таблиці.
     - Створення співробітника (`MEMBER`) з прив'язкою до існуючої фірми та перевірка бейджа `Запрошений`.
     - Створення solo-користувача (`SOLO`).
     - Перевірка валідації полів (некоректний email, короткий пароль).
     - Двомовність UA ⇄ EN усіх полів діалогового вікна.
   - Запуск `pnpm test:admin`.
4. **Візуальна перевірка**:
   - Збереження скріншотів модального вікна та оновленої таблиці.
