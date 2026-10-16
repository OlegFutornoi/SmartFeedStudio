import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: path.join(ROOT, 'eslint.config.mjs') });

const TSX = 'apps/desktop/src/modules/demo/components/Demo.tsx';
const CONTROLLER = 'services/backend-api/src/modules/suppliers/suppliers.controller.ts';

/** @returns {Promise<string[]>} messages of the invariants (rules tagged "[ID]"). */
async function lint(code, filePath) {
  const [res] = await eslint.lintText(code, { filePath });
  return res.messages.map((m) => `${m.ruleId}: ${m.message}`);
}

function ids(messages) {
  return messages.flatMap((m) => m.match(/\[([A-Z0-9]+-\d+)\]/)?.[1] ?? []);
}

test('UI-02: hardcoded palette classes are reported (string + template literal)', async () => {
  const msgs = await lint(
    `export const A = () => <span className="text-emerald-600 dark:text-emerald-400">x</span>;
     export const B = (on: boolean) => <i className={\`bg-amber-500/10 \${on ? 'x' : ''}\`} />;`,
    TSX,
  );
  assert.equal(ids(msgs).filter((i) => i === 'UI-02').length, 2, msgs.join('\n'));
});

test('UI-02: semantic tokens are clean', async () => {
  const msgs = await lint(
    `export const A = () => <span className="text-success bg-success/15 border-success/30 text-muted-foreground">x</span>;`,
    TSX,
  );
  assert.deepEqual(ids(msgs), [], msgs.join('\n'));
});

test('UI-01: translucent header with backdrop-blur is reported', async () => {
  const msgs = await lint(
    `export const H = () => <div className="p-4 border-b bg-card/60 backdrop-blur-xs">x</div>;`,
    TSX,
  );
  assert.ok(ids(msgs).includes('UI-01'), msgs.join('\n'));
});

test('UI-05: raw HTML controls are reported, shadcn components and hidden inputs are not', async () => {
  const bad = await lint(
    `export const F = () => (<div><label>Name</label><button>Go</button><table><tr><td>1</td></tr></table></div>);`,
    TSX,
  );
  assert.ok(ids(bad).filter((i) => i === 'UI-05').length >= 4, bad.join('\n'));

  const good = await lint(
    `import { Label } from '@/components/ui/label';
     import { Button } from '@/components/ui/button';
     export const F = () => (<form><input type="hidden" value="t" /><Label>Name</Label><Button>Go</Button></form>);`,
    TSX,
  );
  assert.deepEqual(ids(good), [], good.join('\n'));
});

test('UI-05: components/ui primitives themselves are exempt', async () => {
  const msgs = await lint(
    `export const Btn = () => <button className="bg-primary">x</button>;`,
    'apps/desktop/src/components/ui/demo-primitive.tsx',
  );
  assert.deepEqual(ids(msgs), [], msgs.join('\n'));
});

test('UI-06: noun suffix next to an expression inside TableCell is reported', async () => {
  const msgs = await lint(
    `import { TableCell } from '@/components/ui/table';
     export const C = ({ n }: { n: number }) => <TableCell>{n} фідів</TableCell>;`,
    TSX,
  );
  assert.ok(ids(msgs).includes('UI-06'), msgs.join('\n'));
  const clean = await lint(
    `import { TableCell } from '@/components/ui/table';
     export const C = ({ n }: { n: number }) => <TableCell>{n}</TableCell>;`,
    TSX,
  );
  assert.deepEqual(ids(clean), [], clean.join('\n'));
});

test('I18N-01: raw Cyrillic text in JSX is reported; translated text is not', async () => {
  const bad = await lint(`export const T = () => <p>Привіт, світе</p>;`, TSX);
  assert.ok(ids(bad).includes('I18N-01'), bad.join('\n'));
  const good = await lint(
    `export const T = ({ t }: { t: (k: string) => string }) => <p>{t('hello')}</p>;`,
    TSX,
  );
  assert.deepEqual(ids(good), [], good.join('\n'));
});

test('BE-01: raw @Query(key) in a controller is reported; DTO class is not', async () => {
  const bad = await lint(
    `export class C { list(@Query('limit') limit?: number) { return limit; } }`,
    CONTROLLER,
  );
  assert.ok(ids(bad).includes('BE-01'), bad.join('\n'));
  const good = await lint(
    `export class C { list(@Query() query: ListQueryDto) { return query; } }`,
    CONTROLLER,
  );
  assert.deepEqual(ids(good), [], good.join('\n'));
});

test('CORE-03: explicit any is a blocking error', async () => {
  const [res] = await eslint.lintText(`export const x: any = 1;`, {
    filePath: 'services/backend-api/src/modules/auth/auth.service.ts',
  });
  const hit = res.messages.find((m) => m.ruleId === '@typescript-eslint/no-explicit-any');
  assert.ok(hit, 'no-explicit-any not reported');
  assert.equal(hit.severity, 2);
});
