import assert from 'node:assert/strict';
import test from 'node:test';
import { checkFile } from './structural.mjs';

const rules = (violations) => violations.map((v) => v.rule);

test('ARCH-04: two CQRS handlers in one file are reported', () => {
  const code = `
@QueryHandler(A) export class AHandler {}
@QueryHandler(B) export class BHandler {}`;
  const v = checkFile('services/backend-api/src/modules/demo/queries/demo.handlers.ts', code);
  assert.deepEqual(rules(v), ['ARCH-04']);
});

test('ARCH-04: one handler per file and pure re-export facades are clean', () => {
  const one = `@CommandHandler(A) export class AHandler {}`;
  const facade = `export { AHandler } from '@/modules/demo/commands/a.handler';`;
  assert.deepEqual(
    checkFile('services/backend-api/src/modules/demo/commands/a.handler.ts', one),
    [],
  );
  assert.deepEqual(
    checkFile('services/backend-api/src/modules/demo/commands/index.ts', facade),
    [],
  );
});

test('BE-07: findFirst + create on the SAME model without upsert/$transaction is reported', () => {
  const code = `
const existing = await this.prisma.supplierSyncSetting.findFirst({ where: { supplierId } });
if (!existing) { await this.prisma.supplierSyncSetting.create({ data }); }`;
  const v = checkFile('services/backend-api/src/modules/demo/commands/x.handler.ts', code);
  assert.deepEqual(rules(v), ['BE-07']);
  assert.equal(v[0].line, 2);
});

test('BE-07: ownership check on a PARENT model before creating a child is not a race', () => {
  const code = `
const supplier = await this.prisma.supplier.findFirst({ where: { id, userId } });
await this.prisma.supplierPricingRule.create({ data: { supplierId: supplier.id } });`;
  assert.deepEqual(
    checkFile('services/backend-api/src/modules/demo/commands/x.handler.ts', code),
    [],
  );
});

test('BE-07: atomic upsert and $transaction are clean', () => {
  const upsert = `await this.prisma.supplierSyncSetting.upsert({ where: { supplierId }, update, create });`;
  const tx = `
await this.prisma.$transaction(async (tx) => {
  const a = await tx.item.findFirst({ where: { id } });
  if (!a) await tx.item.create({ data });
});`;
  assert.deepEqual(
    checkFile('services/backend-api/src/modules/demo/commands/x.handler.ts', upsert),
    [],
  );
  assert.deepEqual(
    checkFile('services/backend-api/src/modules/demo/commands/y.handler.ts', tx),
    [],
  );
});

test('BE-02: mutating controller route without JwtAuthGuard or @Public is reported', () => {
  const bad = `@Controller('x') export class C { @Post() create() {} }`;
  const v = checkFile('services/backend-api/src/modules/demo/demo.controller.ts', bad);
  assert.deepEqual(rules(v), ['BE-02']);
});

test('BE-02: guarded, public, or read-only controllers are clean', () => {
  const guarded = `@UseGuards(JwtAuthGuard) @Controller('x') export class C { @Delete(':id') rm() {} }`;
  const pub = `@Controller('x') export class C { @Public() @Post('login') login() {} }`;
  const readOnly = `@Controller('x') export class C { @Get() list() {} }`;
  assert.deepEqual(checkFile('services/backend-api/src/modules/demo/a.controller.ts', guarded), []);
  assert.deepEqual(checkFile('services/backend-api/src/modules/demo/b.controller.ts', pub), []);
  assert.deepEqual(
    checkFile('services/backend-api/src/modules/demo/c.controller.ts', readOnly),
    [],
  );
});

test('non-backend and generated files are ignored', () => {
  const code = `@QueryHandler(A) class A {} @QueryHandler(B) class B {}`;
  assert.deepEqual(checkFile('apps/desktop/src/x.ts', code), []);
  assert.deepEqual(checkFile('services/backend-api/src/generated/prisma/x.ts', code), []);
});

test('ARCH-05: UsersModule JWT awareness is reported', () => {
  const bad = `import { JwtService } from '@nestjs/jwt'; export class UsersService {}`;
  const v = checkFile('services/backend-api/src/modules/users/users.service.ts', bad);
  assert.deepEqual(rules(v), ['ARCH-05']);
});

test('Prisma schema: DB-04, DB-02, DB-03, DB-01, DB-05 checks', () => {
  const badSchema = `
model BadItem {
  id String @id
  createdAt DateTime
  supplierId String
  supplier Supplier @relation(fields: [supplierId], references: [id])
}
`;
  const v = checkFile('services/backend-api/prisma/schema.prisma', badSchema);
  assert.ok(v.some((x) => x.rule === 'DB-04'), 'DB-04 missing default(cuid())');
  assert.ok(v.some((x) => x.rule === 'DB-02'), 'DB-02 missing timestamptz(6)');
  assert.ok(v.some((x) => x.rule === 'DB-03'), 'DB-03 missing @@map');
  assert.ok(v.some((x) => x.rule === 'DB-01'), 'DB-01 missing @@index([supplierId])');
  assert.ok(v.some((x) => x.rule === 'DB-05'), 'DB-05 missing onDelete');
});

test('DB-06: Potential N+1 query loops are reported', () => {
  const code = `
for (const id of ids) {
  const item = await this.prisma.product.findUnique({ where: { id } });
}`;
  const v = checkFile('services/backend-api/src/modules/products/products.service.ts', code);
  assert.deepEqual(rules(v), ['DB-06']);
});

test('DB-08: Non-DB operations inside $transaction are reported', () => {
  const code = `
await this.prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id }, data });
  await fetch('https://external-api.com/notify');
});`;
  const v = checkFile('services/backend-api/src/modules/users/commands/update.handler.ts', code);
  assert.deepEqual(rules(v), ['DB-08']);
});

test('DB-09 and BE-04: PrismaService driver adapter and zero fallback secret', () => {
  const badDriver = `export class PrismaService extends PrismaClient {}`;
  const v1 = checkFile('services/backend-api/src/prisma/prisma.service.ts', badDriver);
  assert.ok(v1.some((x) => x.rule === 'DB-09'));

  const badSecret = `
import { PrismaPg } from '@prisma/adapter-pg';
const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/db';
`;
  const v2 = checkFile('services/backend-api/src/prisma/prisma.service.ts', badSecret);
  assert.ok(v2.some((x) => x.rule === 'BE-04'));
});

test('DB-10: schema.prisma pg_trgm extension requirement', () => {
  const noTrgm = `datasource db { provider = "postgresql" }`;
  const v = checkFile('services/backend-api/prisma/schema.prisma', noTrgm);
  assert.ok(v.some((x) => x.rule === 'DB-10'));
});

test('DB-07: Cursor pagination requirement on feed services', () => {
  const offsetQuery = `
return this.prisma.product.findMany({
  where: { feedId },
  skip: 20,
  take: 10,
});`;
  const v = checkFile('services/backend-api/src/modules/feeds/feeds.service.ts', offsetQuery);
  assert.ok(v.some((x) => x.rule === 'DB-07'));
});

test('DB-12: Strict Prisma types reports as any in prisma queries', () => {
  const badPrismaAny = `
const user = await this.prisma.user.create({ data: { name: 'test' } as any });
`;
  const v = checkFile('services/backend-api/src/modules/users/users.service.ts', badPrismaAny);
  assert.ok(v.some((x) => x.rule === 'DB-12'));
  assert.ok(v.some((x) => x.rule === 'CORE-03'));
});
