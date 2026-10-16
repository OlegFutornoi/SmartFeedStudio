/**
 * SmartFeed Studio — ESLint invariants block (flat config).
 *
 * Turns markdown rules into blocking, AST-level checks that run inside `pnpm lint`
 * (the same command agents already run). Each message is tagged `[RULE-ID]` so the
 * ratchet collector can count violations per invariant.
 *
 * Severity starts at `warn` for rules with legacy debt; flip to `error` only after the
 * ratchet baseline for that rule reaches 0 (see plans/active/agent_guardrails_hardening_plan.md).
 */

const PALETTE_COLORS =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PALETTE_UTILS =
  'text|bg|border|ring|from|via|to|fill|stroke|outline|divide|shadow|decoration|accent|caret|placeholder';

const PALETTE_REGEX = `\\b(?:${PALETTE_UTILS})-(?:${PALETTE_COLORS})-\\d{2,3}\\b`;
// NOTE: `/` must be written \\x2f inside selector regexes: a literal `/` terminates the esquery regex.
const TRANSLUCENT_HEADER_REGEX =
  '^(?=.*\\bbackdrop-blur)(?=.*\\bbg-(?:card|background|popover|muted)\\x2f\\d+)'; /* \x2f = '/', which would terminate the esquery regex literal */
const RAW_CONTROLS =
  'button|select|textarea|label|table|thead|tbody|tfoot|tr|th|td|dialog|progress';
const TEXT_LETTERS = 'A-Za-zА-Яа-яІіЇїЄєҐґ';
const CYRILLIC = 'А-Яа-яІіЇїЄєҐґ';

const UI_ERR = {
  palette:
    '[UI-02] Hardcoded palette color. Use semantic tokens: text-success, bg-success/15 border-success/30, text-primary, text-destructive, text-muted-foreground, bg-muted.',
  header:
    '[UI-01] Translucent header/surface (bg-*/NN + backdrop-blur). Sticky tables, sheet and dialog headers must be 100% solid (bg-card / bg-background).',
  shadcn:
    '[UI-05] Raw HTML control. Compose UI only from official shadcn components in @/components/ui/* (Button, Input, Label, Table, Select, Dialog…). Install a missing one with `npx shadcn@latest add <name>`; never hand-roll controls.',
  tableCell:
    '[UI-06] Noun/suffix text next to a value inside <TableCell>. The column header already names the entity: render a clean number or <Badge> only.',
  i18n: '[I18N-01] Raw Cyrillic text in JSX. Use t(...) with keys present in both uk and en locales.',
};

const paletteSelectors = [
  { selector: `Literal[value=/${PALETTE_REGEX}/]`, message: UI_ERR.palette },
  { selector: `TemplateElement[value.raw=/${PALETTE_REGEX}/]`, message: UI_ERR.palette },
];

const headerSelectors = [
  { selector: `Literal[value=/${TRANSLUCENT_HEADER_REGEX}/]`, message: UI_ERR.header },
  { selector: `TemplateElement[value.raw=/${TRANSLUCENT_HEADER_REGEX}/]`, message: UI_ERR.header },
];

const shadcnSelectors = [
  { selector: `JSXOpeningElement[name.name=/^(?:${RAW_CONTROLS})$/]`, message: UI_ERR.shadcn },
  {
    selector:
      "JSXOpeningElement[name.name='input']:not(:has(JSXAttribute[name.name='type'][value.value=/^(?:hidden|file)$/]))",
    message: UI_ERR.shadcn,
  },
];

const textSelectors = [
  {
    selector: `JSXElement[openingElement.name.name='TableCell']:has(> JSXExpressionContainer) > JSXText[value=/[${TEXT_LETTERS}]{2,}/]`,
    message: UI_ERR.tableCell,
  },
  { selector: `JSXText[value=/[${CYRILLIC}]{2,}/]`, message: UI_ERR.i18n },
];

const FRONTEND_FILES = ['apps/desktop/src/**/*.{ts,tsx}', 'apps/admin-portal/src/**/*.{ts,tsx}'];

const FRONTEND_IGNORES = [
  // shadcn primitives (and our thin wrappers) are the ONLY place raw HTML controls may live.
  '**/components/ui/**',
  '**/generated/**',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
];

export const invariantsConfig = [
  {
    name: 'smartfeed/invariants/frontend',
    files: FRONTEND_FILES,
    ignores: FRONTEND_IGNORES,
    rules: {
      'no-restricted-syntax': [
        'warn',
        ...paletteSelectors,
        ...headerSelectors,
        ...shadcnSelectors,
        ...textSelectors,
      ],
    },
  },
  {
    name: 'smartfeed/invariants/backend-controllers',
    files: ['services/backend-api/src/**/*.controller.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Decorator[expression.callee.name='Query'][expression.arguments.length>0]",
          message:
            '[BE-01] Raw @Query(key). Declare a dedicated Query DTO class (class-validator + @Type) and use @Query() dto.',
        },
      ],
    },
  },
  {
    name: 'smartfeed/invariants/core',
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/generated/**', '**/*.d.ts'],
    rules: {
      // CORE-03: zero `any`. Baseline was 0 on 2026-10-16, so this is blocking immediately.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];

/**
 * Typed linting (async-safety). Scoped to the backend only: typing the whole monorepo tripled `pnpm lint` (11s -> 39s, measured) and
 * the frontend gains little (un-awaited Prisma writes are the data-loss risk);
 * `projectService` resolves the nearest tsconfig per file (typescript-eslint v8).
 * Un-awaited Prisma writes / API calls are silent data-loss bugs that `tsc` cannot see.
 */
export const typedLintConfig = [
  {
    name: 'smartfeed/typed-lint',
    files: ['services/backend-api/src/**/*.ts'],
    ignores: ['**/generated/**', '**/*.d.ts'],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      // React event props (onClick={async …}) are an accepted pattern; flag every other misuse.
      '@typescript-eslint/no-misused-promises': [
        'warn',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
];
