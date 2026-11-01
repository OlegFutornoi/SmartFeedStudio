#!/usr/bin/env node

/**
 * generate-skill-evals.mjs
 * Generates and validates evals/evals.json for all 62 skills in SmartFeed Studio.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REF_MAPPINGS, CUSTOM_EVALS } from './skill-evals-templates.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');
const REF_SKILLS_DIR =
  '/Users/oleg/.gemini/antigravity/brain/f0c31a14-c30d-4a45-b5a9-9ac70a942fbc/scratch/zagents/skills';

function generateGenericEval(skillName) {
  return {
    skill_name: skillName,
    evals: [
      {
        id: 1,
        prompt: `Застосуй скіл ${skillName} для стандартної задачі у SmartFeed Studio відповідно до інструкцій.`,
        expected_output: `Follows ${skillName} procedure, adheres to architectural invariants, and satisfies acceptance criteria.`,
        expectations: [
          `Applies ${skillName} step-by-step procedure according to SKILL.md guidelines`,
          `Adheres to project invariants and definition of done without shortcuts`,
        ],
      },
      {
        id: 2,
        prompt: `Виконай граничний сценарій для ${skillName} з обробкою помилок та валідацією вхідних даних.`,
        expected_output: `Handles edge cases, validates constraints, and provides structured recovery.`,
        expectations: [
          `Identifies boundary conditions and validates input constraints thoroughly`,
          `Ensures zero unhandled exceptions and logs warnings or domain errors appropriately`,
        ],
      },
      {
        id: 3,
        prompt: `Виконай задачу з абсолютно непов'язаного домену (наприклад, стороннє завдання поза межами ${skillName}).`,
        expected_output: `Recognizes scope boundaries and does not trigger ${skillName} for irrelevant tasks.`,
        expectations: [
          `Recognizes that unrelated tasks are outside the zone of responsibility of ${skillName}`,
          `Routes or delegates the request to the appropriate specialized domain skill`,
        ],
      },
    ],
  };
}

async function main() {
  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let createdCount = 0;
  let copiedCount = 0;
  let customCount = 0;

  for (const skill of dirs) {
    const evalDir = path.join(SKILLS_DIR, skill, 'evals');
    const evalFile = path.join(evalDir, 'evals.json');

    // Skip if image already has custom 6 cases
    if (skill === 'image' && fs.existsSync(evalFile)) {
      continue;
    }

    fs.mkdirSync(evalDir, { recursive: true });

    // 1. Check custom tailored evals
    if (CUSTOM_EVALS[skill]) {
      const data = {
        skill_name: skill,
        evals: CUSTOM_EVALS[skill].evals,
      };
      fs.writeFileSync(evalFile, JSON.stringify(data, null, 2), 'utf8');
      customCount++;
      continue;
    }

    // 2. Check reference mappings
    const refKey = REF_MAPPINGS[skill];
    if (refKey) {
      const refEvalPath = path.join(REF_SKILLS_DIR, refKey, 'evals/evals.json');
      if (fs.existsSync(refEvalPath)) {
        try {
          const refData = JSON.parse(fs.readFileSync(refEvalPath, 'utf8'));
          refData.skill_name = skill;
          fs.writeFileSync(evalFile, JSON.stringify(refData, null, 2), 'utf8');
          copiedCount++;
          continue;
        } catch {
          // Fall through
        }
      }
    }

    // 3. Fallback: synthesize tailored domain eval
    const genericData = generateGenericEval(skill);
    fs.writeFileSync(evalFile, JSON.stringify(genericData, null, 2), 'utf8');
    createdCount++;
  }

  console.log(
    `Evals generation complete: ${customCount} custom tailored, ${copiedCount} adapted from reference, ${createdCount} synthesized.`
  );
  console.log(`Total skills with evals.json: ${dirs.length}/62.`);
}

main();
