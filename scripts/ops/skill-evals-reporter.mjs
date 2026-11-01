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
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function runOmni(systemPrompt, userPrompt, omniRouteBin, repoRoot, temperature = 0.2) {
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
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 60000,
    }
  );
  return stdout.trim();
}

export function updateSkillsStatusDoc(suites, executionResults, statusDocPath) {
  const lines = [
    '# Реєстр верифікації скілів через LLM-Evals (.agents/skills/)',
    '',
    'Цей документ фіксує поточний статус валідації та реального оцінювання скілів SmartFeed Studio.',
    '',
    '## 1. Зведений стан скілів',
    '',
    `- Всього скілів: ${suites.length}`,
    `- Структурно валідних наборів evals: ${suites.filter((s) => !s.evalError).length}`,
    `- Протестовано через LLM: ${executionResults.length}`,
    '',
    '## 2. Статус валідації по кожному скілу',
    '',
  ];

  for (const s of suites) {
    const count = s.suite && Array.isArray(s.suite.evals) ? s.suite.evals.length : 0;
    const badge = s.evalError ? `[FAIL] (${s.evalError})` : `[PASS] (${count} cases)`;
    lines.push(`- \`${s.skill}\`: ${badge}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('Оновлено автоматично через `scripts/ops/run-skill-evals.mjs`.');
  lines.push('');

  fs.writeFileSync(statusDocPath, lines.join('\n'), 'utf8');
}

