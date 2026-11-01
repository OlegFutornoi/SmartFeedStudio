import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runValidation, parseFrontmatter } from './validate-agents.mjs';
import { validateEnforcement } from './validator/agent-checks.mjs';

describe('Agent Architecture Validator Tests (validate-agents.mjs)', () => {
  it('Parses YAML frontmatter correctly', () => {
    const raw = `---
name: test-agent
description: Test Description
subagent: true
skills:
  - skills/test-skill
---
# Body`;
    const fm = parseFrontmatter(raw);
    assert.equal(fm.name, 'test-agent');
    assert.equal(fm.description, 'Test Description');
    assert.equal(fm.subagent, 'true');
    assert.deepEqual(fm.skills, ['skills/test-skill']);
  });

  it('Validates production .agents configuration with 0 errors', () => {
    const { errors, alwaysOnChars, skillsCount } = runValidation();
    assert.equal(errors.length, 0, `Validation failed with errors: ${errors.join(', ')}`);
    assert.ok(alwaysOnChars <= 14000, `alwaysOnChars ${alwaysOnChars} exceeds budget`);
    assert.equal(skillsCount, 43, 'All 43 skills must be present');
  });

  it('Rejects invalid mode in enforcement map', () => {
    const errors = [];
    const tmpFile = path.join(os.tmpdir(), `test-enforce-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify({ 'TEST-01': { mode: 'invalid' } }));
    validateEnforcement(tmpFile, '', [], errors);
    fs.unlinkSync(tmpFile);
    assert.ok(errors.some((e) => e.includes('invalid mode "invalid"')));
  });

  it('Detects Cyrillic characters in agent definitions', async () => {
    const errors = [];
    const warnings = [];
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-cyr-'));
    const agentFile = path.join(tmpDir, 'planner.md');
    fs.writeFileSync(
      agentFile,
      `---
name: planner
description: Test
subagent: true
---
# Опис агента
`
    );
    const { validateAgents } = await import('./validator/agent-checks.mjs');
    validateAgents(tmpDir, '', errors, warnings);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    assert.ok(errors.some((e) => e.includes('[CYRILLIC]')));
  });
});

