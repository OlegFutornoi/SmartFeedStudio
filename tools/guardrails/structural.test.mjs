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
