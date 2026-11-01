import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runValidation, parseFrontmatter } from './validate-agents.mjs';

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
    assert.equal(skillsCount, 62, 'All 62 skills must be present');
  });
});

