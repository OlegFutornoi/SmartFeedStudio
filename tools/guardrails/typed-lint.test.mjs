import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: path.join(ROOT, 'eslint.config.mjs') });

// Typed linting needs a file that belongs to a tsconfig; we lint snippets "as" these real files.
const BACKEND_FILE = 'services/backend-api/src/modules/suppliers/queries/get-suppliers.handler.ts';
const DESKTOP_FILE = 'apps/desktop/src/lib/api/suppliers.ts';

async function ruleIds(code, filePath) {
  const [res] = await eslint.lintText(code, { filePath });
  const fatal = res.messages.find((m) => m.fatal);
  assert.ok(!fatal, `fatal parse/config error: ${fatal?.message}`);
  return res.messages.map((m) => m.ruleId);
}

test('backend: un-awaited promise (e.g. prisma write) is reported by no-floating-promises', async () => {
  const ids = await ruleIds(
    `export async function save(repo: { create(): Promise<void> }) { repo.create(); }`,
    BACKEND_FILE,
  );
  assert.ok(ids.includes('@typescript-eslint/no-floating-promises'), ids.join(','));
});

test('desktop is intentionally NOT type-linted (keeps pnpm lint fast)', async () => {
  const ids = await ruleIds(
    `export async function save(api: { post(): Promise<void> }) { api.post(); }`,
    DESKTOP_FILE,
  );
  assert.ok(!ids.includes('@typescript-eslint/no-floating-promises'), ids.join(','));
});

test('awaited and explicitly voided promises are clean', async () => {
  const ids = await ruleIds(
    `export async function save(api: { post(): Promise<void> }) { await api.post(); void api.post(); }`,
    BACKEND_FILE,
  );
  assert.ok(!ids.includes('@typescript-eslint/no-floating-promises'), ids.join(','));
});

test('await-thenable: awaiting a non-promise is reported', async () => {
  const ids = await ruleIds(`export async function f() { await 5; }`, BACKEND_FILE);
  assert.ok(ids.includes('@typescript-eslint/await-thenable'), ids.join(','));
});
