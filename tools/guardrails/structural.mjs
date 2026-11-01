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
  if (relPath.startsWith('.agents/')) return;
  if (relPath.startsWith('scripts/')) return;

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

function checkUsersModuleJwt(relPath, content, out) {
  if (relPath.includes('/modules/users/') && (/JwtService/.test(content) || /@nestjs\/jwt/.test(content))) {
    out.push({
      rule: 'ARCH-05',
      line: 1,
      message: 'UsersModule must have zero JWT awareness (ARCH-05, DEF-01). Route token creation through AuthModule.',
    });
  }
}

import {
  checkPrismaSchema,
  checkPrismaService,
  checkCursorPagination,
  checkZeroNPlusOne,
  checkShortTransactions,
} from './prisma-checks.mjs';
import { checkSecurityRules } from './security-checks.mjs';
import { checkFrontendRules } from './frontend-checks.mjs';
import { checkTestingRules } from './testing-checks.mjs';
import { checkOpsRules } from './ops-checks.mjs';

function checkNoEmojis(content, out) {
  const emojiMatch = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.exec(content);
  if (emojiMatch) {
    out.push({
      rule: 'BE-14',
      line: lineOf(content, emojiMatch.index),
      message: 'Emojis are strictly forbidden in code and logs (CORE-13, DEF-17). Use ASCII badges.',
    });
  }
}

function checkSafeOsExec(content, out) {
  if (/\b(?:from\s+['"]child_process['"]|require\(['"]child_process['"]\))/.test(content)) {
    if (/\bexec\s*\(/.test(content) && !/\bexecFile\s*\(/.test(content)) {
      out.push({
        rule: 'CORE-05',
        line: 1,
        message: 'Potentially unsafe OS execution (CWE-78). Use execFile with discrete arguments instead of exec.',
      });
    }
  }
}

function checkZeroAsAny(content, out) {
  const anyMatch = /\bas\s+any\b/.exec(content);
  if (anyMatch) {
    out.push({
      rule: 'CORE-03',
      line: lineOf(content, anyMatch.index),
      message: "Zero prohibited type bypasses allowed. Use generated Prisma types, Zod parse, or unknown.",
    });
    if (/prisma\.\w+\.(?:create|update|upsert|findMany|delete)/.test(content)) {
      out.push({
        rule: 'DB-12',
        line: lineOf(content, anyMatch.index),
        message: 'Strict Prisma Types: Zero as any allowed in Prisma clauses.',
      });
    }
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
  checkPrismaSchema(relPath, content, out);
  checkFrontendRules(relPath, content, out);
  checkTestingRules(relPath, content, out);
  checkOpsRules(relPath, content, out);
  checkSecurityRules(relPath, content, out);
  if (!isBackendSource(relPath)) return out;
  checkPrismaService(relPath, content, out);
  checkCursorPagination(relPath, content, out);
  if (relPath.includes('/modules/') && !relPath.endsWith('.module.ts')) checkHandlers(content, out);
  if (relPath.endsWith('.handler.ts') || relPath.endsWith('.service.ts')) {
    checkCheckThenCreate(content, out);
    checkZeroNPlusOne(content, out);
    checkShortTransactions(content, out);
  }
  if (relPath.endsWith('.controller.ts')) checkControllerGuards(content, out);
  checkUsersModuleJwt(relPath, content, out);
  checkNoEmojis(content, out);
  checkSafeOsExec(content, out);
  checkZeroAsAny(content, out);
  return out;
}
