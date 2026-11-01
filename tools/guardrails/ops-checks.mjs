/**
 * SmartFeed Studio — Operations & Governance Guardrails.
 *
 *  OPS-01 Continuous WIKI and AGENTS.md Synchronization
 *  OPS-02 E2E Test Coverage Documentation
 *  OPS-03 SemVer Release Governance
 *  OPS-04 Rollback Runbook for Infrastructure Changes
 *  OPS-05 Standard Monorepo Ports and Access
 *  CORE-12 Quality and Reliability Over "Working is Enough"
 */

export function checkOpsRules(relPath, content, out) {
  // OPS-01: Continuous WIKI and AGENTS.md Synchronization
  if (relPath === 'AGENTS.md') {
    const lower = content.toLowerCase();
    if (!lower.includes('wiki') || !content.includes('.agents/')) {
      out.push({
        rule: 'OPS-01',
        line: 1,
        message:
          'AGENTS.md must maintain active references to wiki and .agents directory.',
      });
    }
  }

  // OPS-02: E2E Test Coverage Documentation
  if (relPath === 'e2e/README.md') {
    const lower = content.toLowerCase();
    if (!lower.includes('coverage') && !lower.includes('matrix')) {
      out.push({
        rule: 'OPS-02',
        line: 1,
        message:
          'e2e/README.md must maintain reference to E2E Coverage Matrix.',
      });
    }
  }

  // OPS-03: SemVer Release Governance
  if (relPath.endsWith('.github/workflows/release.yml')) {
    if (content.includes('git push --tags')) {
      out.push({
        rule: 'OPS-03',
        line: 1,
        message:
          'Accidental global git push --tags prohibited. Push specific release tag only.',
      });
    }
  }

  // OPS-04: Rollback Runbook for Infrastructure Changes
  if (
    relPath.startsWith('prisma/migrations/') &&
    relPath.endsWith('README.md')
  ) {
    const lower = content.toLowerCase();
    if (!lower.includes('rollback')) {
      out.push({
        rule: 'OPS-04',
        line: 1,
        message:
          'Database migration README must document explicit Rollback Runbook.',
      });
    }
  }

  // OPS-05: Standard Monorepo Ports
  if (relPath === 'package.json') {
    try {
      const pkg = JSON.parse(content);
      const scripts = pkg.scripts || {};
      if (scripts['dev:backend'] && !scripts['dev:backend'].includes('4000')) {
        out.push({
          rule: 'OPS-05',
          line: 1,
          message:
            'Backend dev server port mismatch. Must use standard port 4000.',
        });
      }
      if (scripts['dev:admin'] && !scripts['dev:admin'].includes('3000')) {
        out.push({
          rule: 'OPS-05',
          line: 1,
          message:
            'Admin Portal dev server port mismatch. Must use standard port 3000.',
        });
      }
    } catch {
      // JSON parse error handled elsewhere
    }
  }

  // CORE-12: Quality and Reliability (ban untracked @ts-ignore)
  if (
    !relPath.endsWith('.test.mjs') &&
    !relPath.endsWith('.spec.ts') &&
    /\/\/\s*@ts-ignore\b(?!\s*\(ticket:\s*SF-)/.test(content)
  ) {
    out.push({
      rule: 'CORE-12',
      line: 1,
      message:
        'Unannotated @ts-ignore prohibited. Use explicit type refinement or track with ticket: SF-XXX.',
    });
  }
}
