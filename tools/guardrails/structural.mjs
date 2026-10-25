/**
 * SmartFeed Studio — structural invariants that ESLint selectors cannot express.
 *
 *  ARCH-04  one CQRS handler per file
 *  BE-07    check-then-create on the SAME Prisma model without upsert/$transaction (TOCTOU race)
 *  BE-02    mutating controller routes must be guarded (JwtAuthGuard) or explicitly @Public()
 *
 * Pure function over (relativePath, content) so it is unit-testable and reusable by any runner.
 */

const BACKEND_SRC = 'services/backend-api/src/';
const MUTATION_DECORATOR = /@(Post|Put|Patch|Delete)\(/;

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

function isBackendSource(relPath) {
  return (
    relPath.startsWith(BACKEND_SRC) && !relPath.includes('/generated/') && relPath.endsWith('.ts')
  );
}

function checkHandlers(content, out) {
  const handlers = content.match(/@(?:Command|Query)Handler\(/g) ?? [];
  if (handlers.length > 1) {
    out.push({
      rule: 'ARCH-04',
      line: 1,
      message: `${handlers.length} CQRS handlers in one file. Keep exactly one handler per file.`,
    });
  }
}

function checkCheckThenCreate(content, out) {
  if (/\.upsert\(|\$transaction\(/.test(content)) return;
  const finder = /\.(\w+)\.(?:findFirst|findUnique)\(/g;
  let match;
  while ((match = finder.exec(content)) !== null) {
    const model = match[1];
    if (new RegExp(`\\.${model}\\.create(?:Many)?\\(`).test(content)) {
      out.push({
        rule: 'BE-07',
        line: lineOf(content, match.index),
        message: `find + create on "${model}" is a check-then-act race. Use prisma.${model}.upsert(...) or a $transaction.`,
      });
      return;
    }
  }
}

function checkControllerGuards(content, out) {
  if (!MUTATION_DECORATOR.test(content)) return;
  if (/JwtAuthGuard/.test(content) || /@Public\(/.test(content)) return;
  out.push({
    rule: 'BE-02',
    line: 1,
    message: 'Mutating route without @UseGuards(JwtAuthGuard) or explicit @Public().',
  });
}

function checkCentralizedTests(relPath, out) {
  if (relPath.startsWith('e2e/')) return;
  if (relPath.startsWith('tools/guardrails/')) return;
  if (relPath.startsWith('.agents/skills/')) return;

  const isTestFile =
    /\.(spec|test|e2e-spec|adversarial-spec)\.[cm]?[jt]sx?$/.test(relPath) ||
    /playwright\.config\.[cm]?[jt]s$/.test(relPath) ||
    /jest.*\.config\.[cm]?[jt]s$/.test(relPath);

  if (isTestFile) {
    out.push({
      rule: 'TEST-00',
      line: 1,
      message: `Test artifact "${relPath}" found outside e2e/. All automated tests must reside exclusively in e2e/.`,
    });
  }
}

/**
 * @param {string} relPath repo-relative path using forward slashes
 * @param {string} content file text
 * @returns {Array<{ rule: string, line: number, message: string }>}
 */
export function checkFile(relPath, content) {
  const out = [];
  checkCentralizedTests(relPath, out);
  if (!isBackendSource(relPath)) return out;
  if (relPath.includes('/modules/') && !relPath.endsWith('.module.ts')) checkHandlers(content, out);
  if (relPath.endsWith('.handler.ts') || relPath.endsWith('.service.ts'))
    checkCheckThenCreate(content, out);
  if (relPath.endsWith('.controller.ts')) checkControllerGuards(content, out);
  return out;
}
