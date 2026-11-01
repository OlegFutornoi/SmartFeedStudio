import fs from 'node:fs';
import path from 'node:path';

export const SECRET_RE =
  /\b(?:pplx-[A-Za-z0-9]{20,}|ctx7sk-[A-Za-z0-9-]{20,}|fc-[a-f0-9]{24,}|ghp_[A-Za-z0-9]{20,}|AIzaSy[A-Za-z0-9_-]{30,}|gsk_[A-Za-z0-9]{24,}|sk-[A-Za-z0-9_-]{24,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})\b/;

export function checkCommandRules(cmd, lastUserInput) {
  // R1: Block git commit --no-verify / -n (Husky protection)
  if (
    /\bgit\s+commit\b/.test(cmd) &&
    /(?:^|\s)(?:--no-verify|-n)(?:\s|$)/.test(cmd)
  ) {
    return {
      decision: 'deny',
      rule: 'R1_NO_VERIFY',
      reason:
        'Blocked by .agents/hooks.json (R1): Skipping pre-commit hooks (--no-verify / -n) is prohibited.',
    };
  }

  // R2: Ask confirmation on destructive commands
  if (
    /\bgit\s+(?:push\s+.*--force\b|reset\s+--hard\b|clean\s+.*-fd\b)/.test(cmd) ||
    /\brm\s+-rf\s+(?!\.temp\/|\.cache\/)[^\s]+/i.test(cmd)
  ) {
    return {
      decision: 'ask',
      rule: 'R2_DESTRUCTIVE_CMD',
      reason:
        'Destructive git/shell command detected (--force, reset --hard, clean -fd, rm -rf). User confirmation required.',
    };
  }

  // R3: Guard git commit/push without explicit user request (CORE-10)
  if (/\bgit\s+(?:commit|push)\b/.test(cmd)) {
    const isExplicitRequest =
      /(?:commit|push|\/git-commit|закоміть|запуш|коміть)/i.test(lastUserInput);
    if (!isExplicitRequest) {
      return {
        decision: 'ask',
        rule: 'R3_GIT_EXPLICIT_REQUEST',
        reason:
          'Blocked by CORE-10: Autonomous git commit/push without explicit user command requires approval.',
      };
    }
  }

  // R8: Block production flags in test execution
  const hasProdFlag =
    /(?:^|[\s;&|])(?:PROD=1|NODE_ENV=production)(?:\s|$)/.test(cmd);
  const isTestRunner = /\b(?:pnpm\s+e2e|playwright\s+test)\b/.test(cmd);
  const hasAllowProd = /(?:^|[\s;&|])ALLOW_PROD_TESTS=1(?:\s|$)/.test(cmd);
  if (hasProdFlag && isTestRunner && !hasAllowProd) {
    return {
      decision: 'deny',
      rule: 'R8_PROD_TESTS',
      reason:
        'Blocked by .agents/hooks.json (R8): Production test execution requires explicit ALLOW_PROD_TESTS=1.',
    };
  }

  return null;
}

export function checkFileReadRules(rawPath, args, repoRoot) {
  // R5: Dual-Plan Isolation: models execute ONLY compressed plans from plans/completed/
  const activePlanMatch = rawPath.match(/^(.*\/plans)\/active\/([^/]+)\.md$/);
  if (activePlanMatch) {
    const plansDir = activePlanMatch[1];
    const baseSlug = activePlanMatch[2].replace(/\.compressed$/, '');
    const completedCompressed = path.join(
      plansDir,
      'completed',
      `${baseSlug}.compressed.md`
    );
    const completedExact = path.join(plansDir, 'completed', `${baseSlug}.md`);
    const compactFallback = path.join(plansDir, 'compact', `${baseSlug}.md`);

    const targetPath = fs.existsSync(completedCompressed)
      ? completedCompressed
      : fs.existsSync(completedExact)
        ? completedExact
        : fs.existsSync(compactFallback)
          ? compactFallback
          : null;

    if (targetPath) {
      const relTarget = path.relative(repoRoot, targetPath);
      return {
        decision: 'deny',
        rule: 'R5_DUAL_PLAN_ISOLATION',
        reason: `Blocked by Invariant 20 (.agents/hooks.json): plans/active/${activePlanMatch[2]}.md is reserved for human review. The AI model must execute ONLY the compressed version. Read ${relTarget} instead.`,
      };
    }

    return {
      decision: 'deny',
      rule: 'R5_DUAL_PLAN_ISOLATION',
      reason: `Blocked by Invariant 20 (.agents/hooks.json): plans/active/${activePlanMatch[2]}.md is reserved for human review. AI models must execute ONLY compressed plans in plans/completed/. Generate and read plans/completed/${baseSlug}.compressed.md before execution.`,
    };
  }

  // R6: Heavy Artifact Guard (>80 KB)
  const isHeavyCandidate =
    /(?:\/plans\/|\/e2e\/reports\/|\/test-results\/|\.log$|\.agents\/cache\/)/i.test(
      rawPath
    ) && /\.(?:json|log|txt|md|html)$/i.test(rawPath);

  if (isHeavyCandidate && fs.existsSync(rawPath)) {
    const startLine = Number(args.StartLine || args.start_line || 0);
    const endLine = Number(args.EndLine || args.end_line || 0);
    const isBounded = startLine > 0 && endLine > 0 && endLine - startLine <= 300;

    if (!isBounded) {
      try {
        const sizeBytes = fs.statSync(rawPath).size;
        if (sizeBytes > 80 * 1024) {
          const kb = Math.round(sizeBytes / 1024);
          const rel = path.relative(repoRoot, rawPath);
          return {
            decision: 'deny',
            rule: 'R6_HEAVY_ARTIFACT',
            reason: `Blocked by Headroom Guard (R6): '${rel}' is ${kb}KB. Compress with 'pnpm ai:compress ${rel}' or inspect slices with StartLine/EndLine <= 300.`,
          };
        }
      } catch {
        // Fall through
      }
    }
  }

  return null;
}

export function checkFileWriteRules(targetPath, content, replacement) {
  const baseName = path.basename(targetPath);

  // R4: Block writing/modifying protected sensitive files
  const isProtectedFile =
    (/\.env(?:\.[^/]*)?$/.test(targetPath) &&
      !/\.env\.(?:example|sample|template)$/.test(targetPath)) ||
    baseName === 'pnpm-lock.yaml' ||
    targetPath.includes('/.husky/');

  if (isProtectedFile) {
    return {
      decision: 'deny',
      rule: 'R4_PROTECTED_FILE',
      reason: `Blocked by .agents/hooks.json (R4): Direct modification of protected file '${baseName}' is forbidden.`,
    };
  }

  // R7: Block creating probe/debug files in e2e/
  if (
    targetPath.includes('/e2e/') &&
    /^(?:probe|debug|temp|tmp|scratch)[-_].*\.(?:ts|js|mjs|cjs)$/i.test(baseName)
  ) {
    return {
      decision: 'deny',
      rule: 'R7_PROBE_FILE',
      reason:
        'Blocked by .agents/hooks.json (R7): Do not create probe/debug files inside e2e/. Use .temp/ or conversation scratchpad.',
    };
  }

  // R4 (part 2): Secret leak detection in write contents
  const textToScan = String(content || '') + '\n' + String(replacement || '');
  if (SECRET_RE.test(textToScan)) {
    return {
      decision: 'deny',
      rule: 'R4_SECRET_LEAK',
      reason:
        'Blocked by .agents/hooks.json (R4): Hardcoded API secret detected in file write. Store secrets in macOS Keychain or gitignored .env.',
    };
  }

  return null;
}

