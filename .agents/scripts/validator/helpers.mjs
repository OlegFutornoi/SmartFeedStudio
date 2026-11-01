import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const AGENTS_DIR = path.join(REPO_ROOT, '.agents');
export const RULES_DIR = path.join(AGENTS_DIR, 'rules');
export const SKILLS_DIR = path.join(AGENTS_DIR, 'skills');
export const SUBAGENTS_DIR = path.join(AGENTS_DIR, 'agents');
export const AGENTS_MD = path.join(AGENTS_DIR, 'AGENTS.md');
export const ROOT_AGENTS_MD = path.join(REPO_ROOT, 'AGENTS.md');
export const ENFORCEMENT_MAP_PATH = path.join(AGENTS_DIR, 'enforcement-map.json');

export const VALID_RULES = new Set([
  'core',
  'agents',
  'backend',
  'database',
  'frontend',
  'ui',
  'i18n',
  'testing',
  'security',
  'docs_and_ops',
]);

export const MASTER_SKILLS = new Set([
  'frontend',
  'backend',
  'review',
  'git-commit',
  'skill-creator',
]);

export const UTILITY_SKILLS = new Set([
  'find-skills',
  'firecrawl-parse',
  'image',
  'interview-me',
  'project-context-map',
  'lessons-learned-registry',
  'source-driven-development',
  'spec-driven-development',
  'context-engineering',
  'ai-sdk',
  'automated-guardrails-ci',
  'browser-debugging',
  'mock-real-parity',
  'code-simplification',
  'mcp-knowledge-cache',
]);

export const SECRET_RE =
  /\b(?:pplx-[A-Za-z0-9]{20,}|ctx7sk-[A-Za-z0-9-]{20,}|fc-[a-f0-9]{24,}|ghp_[A-Za-z0-9]{20,}|AIzaSy[A-Za-z0-9_-]{30,}|gsk_[A-Za-z0-9]{24,}|sk-[A-Za-z0-9_-]{24,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})\b/;

export const TABLE_PATTERN = /^\s*\|/m;

export function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function parseFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const raw = match[1];
  const map = {};
  let currentListKey = null;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentListKey) {
      if (!Array.isArray(map[currentListKey])) map[currentListKey] = [];
      map[currentListKey].push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      const [, k, v] = kv;
      const vTrim = v.trim();
      if (!vTrim) {
        map[k] = [];
        currentListKey = k;
      } else if (vTrim.startsWith('[') && vTrim.endsWith(']')) {
        map[k] = vTrim
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        currentListKey = null;
      } else {
        map[k] = vTrim.replace(/^['"]|['"]$/g, '');
        currentListKey = null;
      }
    }
  }
  return map;
}

