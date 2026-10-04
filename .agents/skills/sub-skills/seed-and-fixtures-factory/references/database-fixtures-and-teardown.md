# 🗄 Database Fixtures & Teardown — Централізовані фабрики та очищення БД

## 1. Канонічна ієрархія очищення (`cleanDatabase`)

Усі E2E та інтеграційні тести **зобов'язані** використовувати централізований хелпер очищення, який дотримується правильного порядку foreign keys:

```typescript
// test/utils/teardown.helper.ts
import { PrismaClient } from '@prisma/client';

export async function cleanDatabase(prisma: PrismaClient, prefix = 'test_e2e_') {
  // 1. Snapshot & ProductImage (залежні таблиці каталогів)
  await prisma.productImage.deleteMany({
    where: { snapshot: { user: { email: { startsWith: prefix } } } },
  });
  await prisma.snapshot.deleteMany({
    where: { user: { email: { startsWith: prefix } } },
  });

  // 2. OrganizationInvitations & Members
  await prisma.organizationInvitation.deleteMany({
    where: { organization: { name: { startsWith: prefix } } },
  });
  await prisma.organizationMember.deleteMany({
    where: { user: { email: { startsWith: prefix } } },
  });

  // 3. Licenses
  await prisma.license.deleteMany({
    where: { user: { email: { startsWith: prefix } } },
  });

  // 4. Organizations
  await prisma.organization.deleteMany({
    where: { name: { startsWith: prefix } },
  });

  // 5. Users
  await prisma.user.deleteMany({
    where: { email: { startsWith: prefix } },
  });

  // 6. NavigationItems (якщо створювались тестові)
  await prisma.navigationItem.deleteMany({
    where: { titleUk: { startsWith: prefix } },
  });
}
```

---

## 2. Фабрики зв'язаних сутностей (Fixture Builders)

```typescript
let seq = 1;

export async function createTestUserFixture(
  prisma: PrismaClient,
  overrides: Partial<Prisma.UserCreateInput> = {},
) {
  const id = seq++;
  return prisma.user.create({
    data: {
      email: `test_e2e_user_${id}_${Date.now()}@smartfeed.test`,
      fullName: `Test User ${id}`,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fakehash...', // Argon2 pre-hashed
      role: 'USER',
      isActive: true,
      ...overrides,
    },
  });
}

export async function createTestOrgWithLicenseFixture(
  prisma: PrismaClient,
  planType: 'FREE' | 'PRO' | 'ENTERPRISE' = 'PRO',
) {
  const user = await createTestUserFixture(prisma);
  const org = await prisma.organization.create({
    data: {
      name: `test_e2e_org_${seq++}`,
      slug: `test-org-${seq}-${Date.now()}`,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
      licenses: {
        create: {
          key: `SF-${planType}-TEST-${Date.now()}`,
          planType,
          isActive: true,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        },
      },
    },
    include: {
      members: true,
      licenses: true,
    },
  });

  return { user, org, license: org.licenses[0] };
}
```

---

## 3. Стандартне підключення в E2E сьютах

```typescript
describe('Supplier Feeds Module (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // 1. Bootstrap NestJS
    // 2. Обов'язкове попереднє очищення
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    // Фінальне очищення після всіх тестів
    await cleanDatabase(prisma);
    await app.close();
  });
});
```
