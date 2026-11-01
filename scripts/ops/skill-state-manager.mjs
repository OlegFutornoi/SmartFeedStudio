import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');
const STATE_FILE_PATH = path.join(
  REPO_ROOT,
  '.agents/state/skills-eval-status.json',
);
const STATUS_DOC_PATH = path.join(REPO_ROOT, '.agents/SKILLS_STATUS.md');

export function computeSkillHash(skillDir) {
  const hash = crypto.createHash('sha256');
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (
        e.name.startsWith('.') ||
        e.name === 'node_modules' ||
        e.name === 'dist'
      )
        continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile()) {
        hash.update(path.relative(skillDir, full));
        hash.update(fs.readFileSync(full));
      }
    }
  }
  walk(skillDir);
  return hash.digest('hex').slice(0, 16);
}

export function loadSkillsState() {
  if (!fs.existsSync(STATE_FILE_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export function saveSkillsState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE_PATH), { recursive: true });
  fs.writeFileSync(
    STATE_FILE_PATH,
    JSON.stringify(state, null, 2) + '\n',
    'utf8',
  );
}

export function reconcileSkillsStatus(skillsDir = SKILLS_DIR) {
  const state = loadSkillsState();
  const dirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();

  const results = [];
  for (const name of dirs) {
    const sDir = path.join(skillsDir, name);
    const mdPath = path.join(sDir, 'SKILL.md');
    if (!fs.existsSync(mdPath)) continue;

    const currentHash = computeSkillHash(sDir);
    const record = state[name] || null;

    let status = 'UNVERIFIED';
    if (record && record.lastVerifiedHash) {
      if (record.lastVerifiedHash === currentHash) {
        status = record.lastResult === 'pass' ? 'VERIFIED' : 'FAILED';
      } else {
        status = 'MODIFIED';
      }
    }

    let casesCount = 0;
    const evalsPath = path.join(sDir, 'evals/evals.json');
    if (fs.existsSync(evalsPath)) {
      try {
        const evalsData = JSON.parse(fs.readFileSync(evalsPath, 'utf8'));
        casesCount = Array.isArray(evalsData.evals) ? evalsData.evals.length : 0;
      } catch {}
    }

    let triggersCount = 0;
    const trgPath = path.join(sDir, 'evals/triggers.json');
    if (fs.existsSync(trgPath)) {
      try {
        const trgData = JSON.parse(fs.readFileSync(trgPath, 'utf8'));
        triggersCount = Array.isArray(trgData.triggers)
          ? trgData.triggers.length
          : 0;
      } catch {}
    }

    results.push({
      name,
      status,
      currentHash,
      lastVerifiedHash: record?.lastVerifiedHash || null,
      lastVerifiedAt: record?.lastVerifiedAt || null,
      provider: record?.provider || null,
      score: record?.score ?? null,
      baseScore: record?.baseScore ?? null,
      delta: record?.delta ?? null,
      casesCount,
      triggersCount,
    });
  }
  return results;
}

export function recordSkillEvalResult(
  skillName,
  { passed, score, baseScore, delta, provider, runs = 1 },
) {
  const sDir = path.join(SKILLS_DIR, skillName);
  const currentHash = computeSkillHash(sDir);
  const state = loadSkillsState();

  state[skillName] = {
    lastVerifiedHash: currentHash,
    lastVerifiedAt: new Date().toISOString(),
    lastResult: passed ? 'pass' : 'fail',
    provider: provider || 'omniroute',
    score: score ?? 0,
    baseScore: baseScore ?? 0,
    delta: delta ?? 0,
    runs,
  };

  saveSkillsState(state);
}

export function generateSkillsStatusDoc(
  statusList,
  docPath = STATUS_DOC_PATH,
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const total = statusList.length;
  const verified = statusList.filter((s) => s.status === 'VERIFIED').length;
  const modified = statusList.filter((s) => s.status === 'MODIFIED').length;
  const unverified = statusList.filter((s) => s.status === 'UNVERIFIED').length;
  const failed = statusList.filter((s) => s.status === 'FAILED').length;

  const lines = [
    '# Реєстр верифікації та дрифту скілів (.agents/skills/)',
    '',
    'Цей документ автоматично фіксує статус валідації та контролює зміни (дрифт) скілів SmartFeed Studio.',
    '',
    '## 1. Зведений стан каталогу скілів',
    '',
    `- Всього скілів: ${total}`,
    `- [VERIFIED] Перевірено з реальними LLM: ${verified}`,
    `- [MODIFIED] Змінено після останньої перевірки (потрібен повторний прогін): ${modified}`,
    `- [UNVERIFIED] Очікують перевірки з LLM (структурно валідні): ${unverified}`,
    `- [FAILED] Помилка останнього прогону: ${failed}`,
    `- Дата останньої синхронізації: ${dateStr}`,
    '',
    '## 2. Статус кожного скіла',
    '',
  ];

  for (const s of statusList) {
    let details = '';
    if (s.status === 'VERIFIED') {
      const date = s.lastVerifiedAt ? s.lastVerifiedAt.slice(0, 10) : '';
      details = `[VERIFIED] (LLM: ${s.provider}, Score: ${s.score}, Data: ${date}, Hash: ${s.currentHash})`;
    } else if (s.status === 'MODIFIED') {
      const prevDate = s.lastVerifiedAt ? s.lastVerifiedAt.slice(0, 10) : '';
      details = `[MODIFIED] (Змінено після ${prevDate}, Поточний хеш: ${s.currentHash} != Базовий: ${s.lastVerifiedHash})`;
    } else if (s.status === 'FAILED') {
      details = `[FAILED] (Остання оцінка: ${s.score}, Помилка прогону)`;
    } else {
      details = `[UNVERIFIED] (Структура OK: ${s.casesCount} кейсів, ${s.triggersCount} тригерів, Хеш: ${s.currentHash})`;
    }
    lines.push(`- \`${s.name}\`: ${details}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 3. Корисні команди для керування статусом');
  lines.push('');
  lines.push('- Перевірити статус: `pnpm skills:status`');
  lines.push('- Прогнати тільки змінені або неперевірені: `pnpm skills:eval:changed`');
  lines.push('- Прогнати конкретний скіл: `pnpm skills:eval --skill=backend`');
  lines.push('- Прогнати всі скіли (сухий прогін): `pnpm skills:eval:dry`');
  lines.push('- Прогнати маршрутизацію: `pnpm skills:eval:routing`');
  lines.push('');
  lines.push('Оновлено автоматично через `scripts/ops/skills-status.mjs`.');
  lines.push('');

  fs.writeFileSync(docPath, lines.join('\n'), 'utf8');
}

