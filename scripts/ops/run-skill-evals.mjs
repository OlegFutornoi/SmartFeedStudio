#!/usr/bin/env node

/**
 * run-skill-evals.mjs — Antigravity & OmniRoute Native Skill Evaluation Runner
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hasAnyProviderKey,
  extractJsonArray,
  runOmni,
  updateSkillsStatusDoc,
} from './skill-evals-reporter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');
const STATUS_DOC_PATH = path.join(REPO_ROOT, '.agents/SKILLS_STATUS.md');
const OMNIROUTE_BIN = path.join(
  SKILLS_DIR,
  'omniroute-delegation/scripts/omniroute-query.mjs'
);
const MAX_SKILL_CHARS = 24000;

function parseArgs(argv) {
  const opts = {
    skills: [],
    caseId: null,
    dryRun: false,
    runs: 1,
    out: path.join(
      REPO_ROOT,
      '.temp/skill-evals',
      `run-${new Date().toISOString().slice(0, 10)}.json`
    ),
  };

  for (const arg of argv) {
    if (arg.startsWith('--skill=')) {
      opts.skills = arg
        .slice(8)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--case=')) {
      opts.caseId = Number(arg.slice(7));
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

function loadAllSuites(filterSkills = []) {
  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (filterSkills.length > 0) {
    const unknown = filterSkills.filter((f) => !dirs.includes(f));
    if (unknown.length > 0) {
      throw new Error(`Unknown skill(s): ${unknown.join(', ')}`);
    }
  }

  const selected =
    filterSkills.length > 0
      ? dirs.filter((d) => filterSkills.includes(d))
      : dirs;

  const results = [];
  for (const skill of selected) {
    const evalPath = path.join(SKILLS_DIR, skill, 'evals/evals.json');
    const skillMdPath = path.join(SKILLS_DIR, skill, 'SKILL.md');

    let suite = null;
    let evalError = null;

    if (fs.existsSync(evalPath)) {
      try {
        suite = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
      } catch (err) {
        evalError = `Invalid JSON: ${err.message}`;
      }
    } else {
      evalError = 'Missing evals/evals.json';
    }

    const skillMd = fs.existsSync(skillMdPath)
      ? fs.readFileSync(skillMdPath, 'utf8').slice(0, MAX_SKILL_CHARS)
      : '';

    results.push({ skill, evalPath, skillMdPath, suite, skillMd, evalError });
  }
  return results;
}

export function dryRunValidation(suites) {
  const errors = [];
  let validCount = 0;
  let totalCases = 0;

  for (const { skill, suite, evalError } of suites) {
    if (evalError) {
      errors.push(`[${skill}] ${evalError}`);
      continue;
    }
    if (!suite) {
      errors.push(`[${skill}] Missing suite`);
      continue;
    }
    if (suite.skill_name !== skill) {
      errors.push(
        `[${skill}] skill_name "${suite.skill_name}" !== dir "${skill}"`
      );
    }
    if (!Array.isArray(suite.evals) || suite.evals.length < 2) {
      errors.push(`[${skill}] Must contain at least 2 eval cases`);
    } else {
      let caseIdx = 0;
      for (const c of suite.evals) {
        caseIdx++;
        const expList = c.expectations || c.assertions;
        if (
          !c.id ||
          !c.prompt ||
          !c.expected_output ||
          !Array.isArray(expList) ||
          expList.length < 2
        ) {
          errors.push(
            `[${skill}] Case #${c.id || caseIdx} missing required fields or has <2 expectations`
          );
        }
      }
      validCount++;
      totalCases += suite.evals.length;
    }
  }

  return { errors, validCount, totalCases };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const suites = loadAllSuites(opts.skills);

  if (opts.dryRun) {
    const { errors, validCount, totalCases } = dryRunValidation(suites);
    console.log(
      `run-skill-evals (dry-run): verified ${suites.length} skills (${validCount} valid suites, ${totalCases} test cases)`
    );

    if (errors.length > 0) {
      console.error(`\nDry-run detected ${errors.length} issue(s) across skill evals:`);
      errors.slice(0, 20).forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }

    console.log('[PASS] All tested skill eval suites are structurally valid.');
    process.exit(0);
  }

  if (!hasAnyProviderKey(REPO_ROOT)) {
    console.warn(
      '[SKIPPED] No AI provider key (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY) found. Exit code 2 (Honesty Contract).'
    );
    process.exit(2);
  }

  console.log(`Starting real LLM evaluations for ${suites.length} skill(s)...`);
  const results = [];
  let allPassed = true;

  for (const { skill, suite, skillMd, evalError } of suites) {
    if (evalError) {
      console.error(`Skipping ${skill}: ${evalError}`);
      allPassed = false;
      continue;
    }

    const cases = opts.caseId
      ? suite.evals.filter((c) => c.id === opts.caseId)
      : suite.evals;

    console.log(`\nEvaluating skill: ${skill} (${cases.length} cases)...`);
    let skillPassed = true;

    for (const c of cases) {
      process.stdout.write(`  Case #${c.id}: "${c.prompt.slice(0, 45)}..." `);

      try {
        const agentOutput = runOmni(skillMd, c.prompt, OMNIROUTE_BIN, REPO_ROOT, 0.2);
        const judgePrompt = [
          `You are an expert strict quality evaluator.`,
          `Evaluate if the candidate response satisfies each expectation for the skill '${skill}'.`,
          `Prompt: "${c.prompt}"`,
          `Candidate Output:\n${agentOutput}`,
          `Expectations to verify:`,
          ...c.expectations.map((e, idx) => `  ${idx + 1}. ${e}`),
          `Return ONLY a JSON array with one object per expectation:`,
          `[{"expectation": "...", "pass": true/false, "evidence": "direct quote or explanation"}]`,
        ].join('\n');

        const judgeRaw = runOmni(
          'You are a strict QA Judge. Output valid JSON only.',
          judgePrompt,
          OMNIROUTE_BIN,
          REPO_ROOT,
          0.0
        );
        const verdicts = extractJsonArray(judgeRaw);

        if (!verdicts || verdicts.length === 0) {
          console.log('[FAIL] (Judge output unparseable)');
          skillPassed = false;
          allPassed = false;
          continue;
        }

        const failedExpectations = verdicts.filter((v) => !v.pass);
        if (failedExpectations.length > 0) {
          console.log(`[FAIL] (${failedExpectations.length} expectations failed)`);
          skillPassed = false;
          allPassed = false;
        } else {
          console.log('[PASS]');
        }
      } catch (err) {
        console.log(`[ERROR] (${err.message})`);
        skillPassed = false;
        allPassed = false;
      }
    }
    results.push({ skill, passed: skillPassed });
  }

  updateSkillsStatusDoc(suites, results, STATUS_DOC_PATH);
  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify(results, null, 2), 'utf8');

  console.log(`\nEvaluation complete. Results saved to: ${opts.out}`);
  process.exit(allPassed ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Runner fatal error:', err);
    process.exit(1);
  });
}
