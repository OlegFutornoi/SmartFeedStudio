#!/usr/bin/env node

/**
 * run-skill-routing-evals.mjs
 * Evaluates skill routing and trigger accuracy across SmartFeed Studio skills.
 * Tests whether LLM selects the correct skill given user prompt and catalog descriptions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasAnyProviderKey, runOmni } from './skill-evals-reporter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');
const OMNIROUTE_BIN = path.join(
  SKILLS_DIR,
  'omniroute-delegation/scripts/omniroute-query.mjs'
);

function parseArgs(argv) {
  const opts = {
    skills: [],
    split: 'test',
    dryRun: false,
    runs: 1,
    out: path.join(
      REPO_ROOT,
      '.temp/skill-evals',
      `routing-${new Date().toISOString().slice(0, 10)}.json`
    ),
  };

  for (const arg of argv) {
    if (arg.startsWith('--skills=')) {
      opts.skills = arg
        .slice(9)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--split=')) {
      opts.split = arg.slice(8);
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg.startsWith('--runs=')) {
      opts.runs = Number(arg.slice(7)) || 1;
    } else if (arg.startsWith('--out=')) {
      opts.out = path.resolve(REPO_ROOT, arg.slice(6));
    }
  }
  return opts;
}

function loadCatalog() {
  const skills = [];
  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const skill of dirs) {
    const mdPath = path.join(SKILLS_DIR, skill, 'SKILL.md');
    const trgPath = path.join(SKILLS_DIR, skill, 'evals/triggers.json');

    if (!fs.existsSync(mdPath) || !fs.existsSync(trgPath)) continue;

    const mdText = fs.readFileSync(mdPath, 'utf8');
    const descMatch = mdText.match(/^description:\s*(.*)$/m);
    const desc = descMatch ? descMatch[1] : '';

    let triggers = [];
    try {
      const parsed = JSON.parse(fs.readFileSync(trgPath, 'utf8'));
      triggers = parsed.triggers || [];
    } catch {
      triggers = [];
    }

    skills.push({ name: skill, description: desc, triggers });
  }

  return skills;
}

function extractSelectedSkills(rawOutput) {
  let cleaned = rawOutput.trim();
  if (cleaned.includes('```')) {
    const m = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) cleaned = m[1].trim();
  }
  try {
    const obj = JSON.parse(cleaned);
    if (Array.isArray(obj.selected_skills)) return obj.selected_skills;
    if (Array.isArray(obj.skills)) return obj.skills;
    if (typeof obj.selected_skill === 'string') return [obj.selected_skill];
    if (typeof obj.skill === 'string') return [obj.skill];
  } catch {
    // regex fallback
    const matches = cleaned.match(/"(?:selected_skills|skills)"\s*:\s*\[([^\]]*)\]/);
    if (matches) {
      return matches[1]
        .split(',')
        .map((s) => s.replace(/["'\s]/g, ''))
        .filter(Boolean);
    }
  }
  return [];
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const catalog = loadCatalog();

  const activeSkills =
    opts.skills.length > 0
      ? catalog.filter((s) => opts.skills.includes(s.name))
      : catalog;

  // Prepare test set
  const dataset = [];
  for (const s of activeSkills) {
    for (const t of s.triggers) {
      if (opts.split !== 'all' && t.split !== opts.split) continue;
      dataset.push({
        targetSkill: s.name,
        triggerId: t.id,
        prompt: t.prompt,
        shouldTrigger: t.should_trigger,
        lang: t.lang,
        split: t.split,
        category: t.category,
        expectedSkill: t.expected_skill || null,
      });
    }
  }

  if (opts.dryRun) {
    console.log(
      `run-skill-routing-evals (dry-run): verified catalog of ${catalog.length} skills.`
    );
    console.log(
      `Dataset slice [split=${opts.split}]: ${dataset.length} queries across ${activeSkills.length} active skills.`
    );
    const pos = dataset.filter((d) => d.shouldTrigger);
    const neg = dataset.filter((d) => !d.shouldTrigger);
    console.log(`  - Positive triggers: ${pos.length}`);
    console.log(`  - Negative triggers: ${neg.length}`);
    console.log('[PASS] Routing evaluation suite is structurally valid.');
    process.exit(0);
  }

  if (!hasAnyProviderKey(REPO_ROOT)) {
    console.warn(
      '[SKIPPED] No AI provider key found (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY). Exit code 2 (Honesty Contract).'
    );
    process.exit(2);
  }

  console.log(
    `Starting LLM Routing Evaluation: ${dataset.length} queries across ${activeSkills.length} skills (runs=${opts.runs})...`
  );

  const skillsSummary = catalog
    .map((s) => `- ${s.name}: ${s.description}`)
    .join('\n');

  const systemPrompt = [
    'You are an expert AI Routing Engine for an engineering platform with specialized skills.',
    'Given the user prompt and the following available skills catalog, decide which skill(s) should be activated.',
    'If none of the skills apply (e.g. out of domain prompt), return an empty array.',
    '',
    'Available Skills:',
    skillsSummary,
    '',
    'Output valid JSON only with structure:',
    '{"selected_skills": ["skill-name"], "confidence": 0.95, "reason": "concise explanation"}',
  ].join('\n');

  const perSkillMetrics = {};
  for (const s of activeSkills) {
    perSkillMetrics[s.name] = { tp: 0, fp: 0, tn: 0, fn: 0 };
  }

  let totalQueries = 0;
  let correctDecisions = 0;
  const confusionEvents = [];

  for (const item of dataset) {
    totalQueries++;
    process.stdout.write(
      `[${totalQueries}/${dataset.length}] (${item.targetSkill}) "${item.prompt.slice(0, 40)}..." `
    );

    let isCorrect = false;
    let selected = [];

    try {
      const raw = runOmni(systemPrompt, item.prompt, OMNIROUTE_BIN, REPO_ROOT, 0.1);
      selected = extractSelectedSkills(raw);

      const targetSelected = selected.includes(item.targetSkill);
      const metrics = perSkillMetrics[item.targetSkill];

      if (item.shouldTrigger) {
        if (targetSelected) {
          metrics.tp++;
          isCorrect = true;
        } else {
          metrics.fn++;
          confusionEvents.push({
            prompt: item.prompt,
            expected: item.targetSkill,
            actual: selected,
            type: 'false_negative',
          });
        }
      } else {
        if (!targetSelected) {
          metrics.tn++;
          isCorrect = true;
        } else {
          metrics.fp++;
          confusionEvents.push({
            prompt: item.prompt,
            expected: item.expectedSkill || 'none',
            actual: selected,
            type: 'false_positive',
          });
        }
      }

      if (isCorrect) {
        correctDecisions++;
        console.log('[PASS]');
      } else {
        console.log(`[FAIL] (selected: [${selected.join(', ')}])`);
      }
    } catch (err) {
      console.log(`[ERROR] (${err.message})`);
    }
  }

  const accuracy = totalQueries > 0 ? (correctDecisions / totalQueries) * 100 : 0;
  console.log(`\n==================================================`);
  console.log(`Routing Evaluation Completed:`);
  console.log(`Total queries tested: ${totalQueries}`);
  console.log(`Overall Routing Accuracy: ${accuracy.toFixed(1)}%`);
  console.log(`==================================================\n`);

  const report = {
    date: new Date().toISOString(),
    totalQueries,
    accuracy: Number(accuracy.toFixed(1)),
    perSkillMetrics,
    confusionEvents,
  };

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Report saved to: ${opts.out}`);

  let passing = accuracy >= 90.0;
  for (const [sName, m] of Object.entries(perSkillMetrics)) {
    const totalPositive = m.tp + m.fn;
    if (totalPositive > 0) {
      const recall = (m.tp / totalPositive) * 100;
      if (recall < 80.0) {
        console.warn(`[WARN] Skill ${sName} recall below 80%: ${recall.toFixed(1)}%`);
        passing = false;
      }
    }
  }

  process.exit(passing ? 0 : 1);
}

main().catch((err) => {
  console.error('Routing eval runner error:', err);
  process.exit(1);
});

