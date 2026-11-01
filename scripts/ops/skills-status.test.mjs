import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  computeSkillHash,
  reconcileSkillsStatus,
  recordSkillEvalResult,
  generateSkillsStatusDoc,
} from './skill-state-manager.mjs';

test('computeSkillHash: returns deterministic 16-hex hash and changes on file edit', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-test-'));
  const mdPath = path.join(tmpDir, 'SKILL.md');
  fs.writeFileSync(mdPath, 'name: test-skill', 'utf8');

  const h1 = computeSkillHash(tmpDir);
  assert.equal(typeof h1, 'string');
  assert.equal(h1.length, 16);

  const h2 = computeSkillHash(tmpDir);
  assert.equal(h1, h2, 'Hash must be deterministic');

  fs.writeFileSync(mdPath, 'name: test-skill-modified', 'utf8');
  const h3 = computeSkillHash(tmpDir);
  assert.notEqual(h1, h3, 'Hash must change when skill files are edited');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('generateSkillsStatusDoc: generates valid markdown status document', () => {
  const tmpDoc = path.join(os.tmpdir(), `status-test-${Date.now()}.md`);
  const mockStatus = [
    {
      name: 'backend',
      status: 'VERIFIED',
      currentHash: '1111222233334444',
      lastVerifiedHash: '1111222233334444',
      lastVerifiedAt: '2026-11-01T10:00:00.000Z',
      provider: 'groq',
      score: '3/3',
      casesCount: 3,
      triggersCount: 10,
    },
    {
      name: 'frontend',
      status: 'MODIFIED',
      currentHash: '5555666677778888',
      lastVerifiedHash: '0000000000000000',
      lastVerifiedAt: '2026-10-30T10:00:00.000Z',
      provider: 'gemini',
      score: '3/3',
      casesCount: 3,
      triggersCount: 10,
    },
  ];

  generateSkillsStatusDoc(mockStatus, tmpDoc);
  const content = fs.readFileSync(tmpDoc, 'utf8');

  assert.ok(content.includes('[VERIFIED]'));
  assert.ok(content.includes('[MODIFIED]'));
  assert.ok(content.includes('backend'));
  assert.ok(content.includes('frontend'));

  fs.rmSync(tmpDoc, { force: true });
});

