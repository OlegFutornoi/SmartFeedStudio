import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGuard } from './pre-tool-guard.mjs';
import { evaluateStop } from './stop-guard.mjs';

describe('PreToolUse Guardrail Tests', () => {
  it('CORE-08: Automatically allows MCP tools without confirmation', () => {
    const res = evaluateGuard({
      toolCall: {
        name: 'call_mcp_tool',
        args: { ServerName: 'context7', ToolName: 'query-docs' },
      },
    });
    assert.equal(res.decision, 'allow');
    assert.equal(res.rule, 'CORE-08_MCP_AUTO_APPROVAL');
  });

  it('R1: Hard-blocks git commit with --no-verify or -n', () => {
    const res1 = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git commit --no-verify -m "bypass"' },
      },
    });
    assert.equal(res1.decision, 'deny');
    assert.equal(res1.rule, 'R1_NO_VERIFY');

    const res2 = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git commit -n -m "bypass short"' },
      },
    });
    assert.equal(res2.decision, 'deny');
  });

  it('R2: Prompts user confirmation for destructive commands (--force, reset --hard)', () => {
    const resForce = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git push origin main --force' },
      },
    });
    assert.equal(resForce.decision, 'ask');
    assert.equal(resForce.rule, 'R2_DESTRUCTIVE_CMD');

    const resReset = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git reset --hard HEAD~1' },
      },
    });
    assert.equal(resReset.decision, 'ask');
  });

  it('R3: Prompts user for git commit/push unless explicitly requested (CORE-10)', () => {
    const resBlocked = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git commit -m "auto"' },
      },
      lastUserInput: 'Please fix the bug in backend',
    });
    assert.equal(resBlocked.decision, 'ask');
    assert.equal(resBlocked.rule, 'R3_GIT_EXPLICIT_REQUEST');

    const resAllowed = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git commit -m "feature"' },
      },
      lastUserInput: 'закоміть ці зміни у репозиторій',
    });
    assert.equal(resAllowed.decision, 'allow');
  });

  it('R4: Hard-blocks modifying protected .env files or lockfile', () => {
    const resEnv = evaluateGuard({
      toolCall: {
        name: 'write_file',
        args: { Path: '/workspace/.env', Content: 'SECRET=123' },
      },
    });
    assert.equal(resEnv.decision, 'deny');
    assert.equal(resEnv.rule, 'R4_PROTECTED_FILE');

    const resLock = evaluateGuard({
      toolCall: {
        name: 'edit_file',
        args: { Path: '/workspace/pnpm-lock.yaml', Replacement: '' },
      },
    });
    assert.equal(resLock.decision, 'deny');
  });

  it('R4: Hard-blocks writing hardcoded API secrets to tracked files', () => {
    const dummySecret = ['ctx7', 'sk-', '1234567890abcdef1234567890'].join('');
    const resSecret = evaluateGuard({
      toolCall: {
        name: 'write_file',
        args: {
          Path: '/workspace/services/backend-api/src/config.ts',
          Content: `const key = "${dummySecret}";`,
        },
      },
    });
    assert.equal(resSecret.decision, 'deny');
    assert.equal(resSecret.rule, 'R4_SECRET_LEAK');
  });

  it('R5: Dual-Plan Isolation: blocks reading plans/active/ and enforces plans/completed/<slug>.compressed.md', () => {
    const resActive = evaluateGuard({
      toolCall: {
        name: 'read_file',
        args: { Path: '/workspace/plans/active/test-task.md' },
      },
    });
    assert.equal(resActive.decision, 'deny');
    assert.equal(resActive.rule, 'R5_DUAL_PLAN_ISOLATION');
    assert.match(resActive.reason, /plans\/completed/);
  });

  it('R7: Hard-blocks creating probe/debug files in e2e/', () => {
    const resProbe = evaluateGuard({
      toolCall: {
        name: 'write_file',
        args: {
          Path: '/workspace/e2e/specs/probe-test.spec.ts',
          Content: 'test()',
        },
      },
    });
    assert.equal(resProbe.decision, 'deny');
    assert.equal(resProbe.rule, 'R7_PROBE_FILE');
  });

  it('R8: Hard-blocks running tests with PROD=1 without allowance', () => {
    const resProd = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'PROD=1 pnpm e2e' },
      },
    });
    assert.equal(resProd.decision, 'deny');
    assert.equal(resProd.rule, 'R8_PROD_TESTS');

    const resAllowed = evaluateGuard({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'ALLOW_PROD_TESTS=1 PROD=1 pnpm e2e' },
      },
    });
    assert.equal(resAllowed.decision, 'allow');
  });
});

describe('Stop Guardrail Tests', () => {
  it('Allows stop when terminationReason is not NO_TOOL_CALL', () => {
    const res = evaluateStop({
      terminationReason: 'MAX_INVOCATIONS',
      fullyIdle: true,
      executionNum: 1,
    });
    assert.equal(res.decision, 'stop');
  });

  it('Allows stop when executionNum exceeds limit (>2)', () => {
    const res = evaluateStop({
      terminationReason: 'NO_TOOL_CALL',
      fullyIdle: true,
      executionNum: 3,
    });
    assert.equal(res.decision, 'stop');
  });
});

