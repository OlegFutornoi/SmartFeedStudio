import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function hasAnyProviderKey(repoRoot) {
  const envPath = path.join(repoRoot, '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  const hasGemini =
    Boolean(process.env.GEMINI_API_KEY) || envContent.includes('GEMINI_API_KEY=');
  const hasGroq =
    Boolean(process.env.GROQ_API_KEY) || envContent.includes('GROQ_API_KEY=');
  const hasOpenRouter =
    Boolean(process.env.OPENROUTER_API_KEY) ||
    envContent.includes('OPENROUTER_API_KEY=');
  return hasGemini || hasGroq || hasOpenRouter;
}

export function extractJsonArray(raw) {
  let cleaned = raw.trim();
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) cleaned = match[1].trim();
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.expectations)) {
      return parsed.expectations.map((e) => ({
        expectation: e.text || e.expectation || '',
        pass: typeof e.passed === 'boolean' ? e.passed : Boolean(e.pass),
        reason: e.evidence || e.reason || '',
      }));
    }
  } catch {}

  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {}
  }

  const items = [];
  const blocks = raw.split(/\{\s*"expectation"/g).slice(1);
  for (const b of blocks) {
    const expMatch = b.match(/^\s*:\s*"([\s\S]*?)",/);
    const passMatch = b.match(/"pass"\s*:\s*(true|false)/i);
    const reasonMatch = b.match(/"reason"\s*:\s*"([\s\S]*?)"\s*\}/);
    if (expMatch && passMatch) {
      items.push({
        expectation: expMatch[1],
        pass: passMatch[1].toLowerCase() === 'true',
        reason: reasonMatch ? reasonMatch[1] : '',
      });
    }
  }
  if (items.length > 0) return items;

  return null;
}

export function runOmni(systemPrompt, userPrompt, omniRouteBin, repoRoot, temperature = 0.2, maxTokens = 650) {
  const stdout = execFileSync(
    process.execPath,
    [
      omniRouteBin,
      '--system',
      systemPrompt,
      '--prompt',
      userPrompt,
      '--temp',
      String(temperature),
      '--max-tokens',
      String(maxTokens),
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 600000,
    }
  );
  return stdout.trim();
}

export function updateSkillsStatusDoc(suites, executionResults, statusDocPath) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const resultMap = new Map();
  for (const r of executionResults) {
    resultMap.set(r.skill, r);
  }

  const lines = [
    '# Реєстр верифікації скілів через LLM-Evals (.agents/skills/)',
    '',
    'Цей документ фіксує поточний статус валідації, маршрутизації та реального оцінювання скілів SmartFeed Studio.',
    '',
    '## 1. Зведений стан скілів',
    '',
    `- Всього скілів: ${suites.length}`,
    `- Структурно валідних наборів evals: ${suites.filter((s) => !s.evalError).length}`,
    `- Протестовано через LLM: ${executionResults.length}`,
    `- Дата останнього оновлення: ${dateStr}`,
    '',
    '## 2. Статус валідації по кожному скілу',
    '',
  ];

  for (const s of suites) {
    const evalCount = s.suite && Array.isArray(s.suite.evals) ? s.suite.evals.length : 0;
    const trgCount = s.triggers && Array.isArray(s.triggers.triggers) ? s.triggers.triggers.length : 0;
    const exec = resultMap.get(s.skill);

    let statusSuffix = '';
    if (exec) {
      const passTag = exec.passed ? '[PASS]' : '[FAIL]';
      const deltaTag = exec.delta !== null && exec.delta !== undefined ? `, Delta: +${exec.delta}` : '';
      statusSuffix = ` -> LLM Eval: ${passTag} (Score: ${exec.score}/${evalCount}${deltaTag})`;
    } else {
      statusSuffix = ` -> Dry-run OK (Ready for LLM)`;
    }

    const badge = s.evalError
      ? `[FAIL] (${s.evalError})`
      : `[PASS] (${evalCount} cases, ${trgCount} triggers)${statusSuffix}`;

    lines.push(`- \`${s.skill}\`: ${badge}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('Оновлено автоматично через `scripts/ops/run-skill-evals.mjs`.');
  lines.push('');

  fs.writeFileSync(statusDocPath, lines.join('\n'), 'utf8');
}

