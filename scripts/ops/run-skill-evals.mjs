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
} from './skill-evals-reporter.mjs';
import {
  reconcileSkillsStatus,
  recordSkillEvalResult,
  generateSkillsStatusDoc,
} from './skill-state-manager.mjs';
import { loadAllSuites, dryRunValidation } from './skill-evals-loader.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');
const STATUS_DOC_PATH = path.join(REPO_ROOT, '.agents/SKILLS_STATUS.md');
const OMNIROUTE_BIN = path.join(
  SKILLS_DIR,
  'omniroute-delegation/scripts/omniroute-query.mjs'
);
const GRADER_MD_PATH = path.join(SKILLS_DIR, 'skill-creator/agents/grader.md');
const GRADER_INSTRUCTIONS = fs.existsSync(GRADER_MD_PATH)
  ? fs.readFileSync(GRADER_MD_PATH, 'utf8').slice(0, 4000)
  : 'You are a strict QA Judge. Output valid JSON only.';
const MAX_SKILL_CHARS = 24000;

function parseArgs(argv) {
  const opts = {
    skills: [],
    caseId: null,
    dryRun: false,
    changedOnly: false,
    runs: 1,
    baseline: false,
    judgeProvider: null,
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
    } else if (arg === '--changed') {
      opts.changedOnly = true;
    } else if (arg.startsWith('--case=')) {
      opts.caseId = Number(arg.slice(7));
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--baseline') {
      opts.baseline = true;
    } else if (arg.startsWith('--judge-provider=')) {
      opts.judgeProvider = arg.slice(17);
    } else if (arg.startsWith('--runs=')) {
      opts.runs = Number(arg.slice(7)) || 1;
    } else if (arg.startsWith('--out=')) {
      opts.out = path.resolve(REPO_ROOT, arg.slice(6));
    }
  }
  return opts;
}

export { dryRunValidation };

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.changedOnly) {
    const statusList = reconcileSkillsStatus(SKILLS_DIR);
    const needEval = statusList
      .filter(
        (s) =>
          s.status === 'MODIFIED' ||
          s.status === 'UNVERIFIED' ||
          s.status === 'FAILED'
      )
      .map((s) => s.name);
    if (needEval.length === 0) {
      console.log(
        '[PASS] All skills are already VERIFIED with current code hashes.'
      );
      process.exit(0);
    }
    opts.skills = needEval;
  }

  const suites = loadAllSuites(SKILLS_DIR, opts.skills);

  if (opts.dryRun) {
    const { errors, validCount, totalCases } = dryRunValidation(suites);
    console.log(
      `run-skill-evals (dry-run): verified ${suites.length} skills (${validCount} valid suites, ${totalCases} test cases)`
    );

    if (errors.length > 0) {
      console.error(
        `\nDry-run detected ${errors.length} issue(s) across skill evals:`
      );
      errors.slice(0, 20).forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }

    generateSkillsStatusDoc(reconcileSkillsStatus(SKILLS_DIR), STATUS_DOC_PATH);
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
    let skillScore = 0;
    let baseScore = 0;

    for (const c of cases) {
      process.stdout.write(`  Case #${c.id}: "${c.prompt.slice(0, 45)}..." `);

      try {
        let baselinePassed = false;
        if (opts.baseline) {
          try {
            const baseOutput = runOmni(
              'You are an expert engineer in SmartFeed Studio without extra specialized skills loaded.',
              c.prompt,
              OMNIROUTE_BIN,
              REPO_ROOT,
              0.2
            );
            const baseJudgePrompt = [
              `Evaluate if the candidate response satisfies each expectation for '${skill}'.`,
              `Prompt: "${c.prompt}"`,
              `Candidate Output:\n${baseOutput}`,
              `Expectations:\n${c.expectations.map((e, idx) => `${idx + 1}. ${e}`).join('\n')}`,
              'Return JSON: [{"expectation": string, "pass": boolean, "reason": string}]',
            ].join('\n\n');
            const baseVerdict = extractJsonArray(
              runOmni(
                GRADER_INSTRUCTIONS,
                baseJudgePrompt,
                OMNIROUTE_BIN,
                REPO_ROOT,
                0.0
              )
            );
            if (baseVerdict && baseVerdict.every((v) => v.pass)) {
              baselinePassed = true;
              baseScore++;
            }
          } catch {}
        }

        const candidateSystem = `${skillMd.slice(0, MAX_SKILL_CHARS)}\n\nFollow all instructions from the skill above.`;
        const candidateOutput = runOmni(
          candidateSystem,
          c.prompt,
          OMNIROUTE_BIN,
          REPO_ROOT,
          0.2
        );

        const judgePrompt = [
          `Evaluate if the candidate response satisfies each expectation for '${skill}'.`,
          `Prompt: "${c.prompt}"`,
          `Candidate Output:\n${candidateOutput}`,
          `Expectations:\n${c.expectations.map((e, idx) => `${idx + 1}. ${e}`).join('\n')}`,
          'Return JSON: [{"expectation": string, "pass": boolean, "reason": string}]',
        ].join('\n\n');

        const judgeRaw = runOmni(
          GRADER_INSTRUCTIONS,
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
          skillScore++;
          const baselineTag = opts.baseline
            ? ` [baseline: ${baselinePassed ? 'PASS' : 'FAIL'}]`
            : '';
          console.log(`[PASS]${baselineTag}`);
        }
      } catch (err) {
        console.log(`[ERROR] (${err.message})`);
        skillPassed = false;
        allPassed = false;
      }
    }

    const delta = opts.baseline ? skillScore - baseScore : null;
    if (opts.baseline && delta <= 0) {
      console.warn(
        `  [WARN] Skill ${skill} baseline delta is ${delta} (no measurable improvement over baseline).`
      );
    }
    results.push({ skill, passed: skillPassed, score: skillScore, baseScore, delta });

    recordSkillEvalResult(skill, {
      passed: skillPassed,
      score: `${skillScore}/${cases.length}`,
      baseScore,
      delta,
      provider: opts.judgeProvider || 'omniroute',
      runs: opts.runs,
    });
  }

  generateSkillsStatusDoc(reconcileSkillsStatus(SKILLS_DIR), STATUS_DOC_PATH);
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
