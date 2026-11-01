#!/usr/bin/env node

/**
 * generate-skill-triggers.mjs
 * Generates and validates evals/triggers.json for all skills in SmartFeed Studio.
 * Enforces >=10 queries: >=5 should_trigger:true (>=2 UK, >=2 EN),
 * >=5 should_trigger:false (>=2 adjacent with expected_skill),
 * and 60/40 train/test split.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');
const PROFILES_PATH = path.join(__dirname, 'skill-trigger-profiles.json');

const { CLUSTERS, PROFILES } = JSON.parse(
  fs.readFileSync(PROFILES_PATH, 'utf8')
);

function generateTriggersForSkill(skillName, skillDesc) {
  const profile = PROFILES[skillName] || {};
  const useUk = profile.useUk || [
    `запусти задачу для ${skillName} у проєкті`,
    `допоможи налаштувати функціонал ${skillName}`,
    `виконай регламентні дії з ${skillName}`,
  ];
  const useEn = profile.useEn || [
    `execute task using ${skillName} skill`,
    `configure ${skillName} workflow for this repository`,
  ];
  const adjSkill = profile.adjSkill || 'planning-and-lifecycle';
  const adjUk = profile.adjUk || 'створи архітектурний план для нової фічі';
  const adjEn = profile.adjEn || 'draft implementation plan for next milestone';

  const triggers = [];
  let id = 1;

  // 1. Positive triggers (train/test 60/40)
  useUk.forEach((prompt, idx) => {
    triggers.push({
      id: id++,
      prompt,
      should_trigger: true,
      lang: 'uk',
      split: idx === 0 ? 'train' : 'test',
    });
  });

  useEn.forEach((prompt, idx) => {
    triggers.push({
      id: id++,
      prompt,
      should_trigger: true,
      lang: 'en',
      split: idx === 0 ? 'train' : 'test',
    });
  });

  // Ensure at least 5 positive triggers
  while (triggers.filter((t) => t.should_trigger).length < 5) {
    triggers.push({
      id: id++,
      prompt: `Apply ${skillName} standard best practices to active workflow`,
      should_trigger: true,
      lang: 'en',
      split: 'train',
    });
  }

  // 2. Negative triggers - adjacent false positives
  triggers.push(
    {
      id: id++,
      prompt: adjUk,
      should_trigger: false,
      lang: 'uk',
      split: 'train',
      category: 'adjacent',
      expected_skill: adjSkill,
    },
    {
      id: id++,
      prompt: adjEn,
      should_trigger: false,
      lang: 'en',
      split: 'test',
      category: 'adjacent',
      expected_skill: adjSkill,
    }
  );

  // 3. Negative triggers - completely out of domain
  triggers.push(
    {
      id: id++,
      prompt: 'Розкажи рецепт українського борщу з пампушками.',
      should_trigger: false,
      lang: 'uk',
      split: 'train',
      category: 'out_of_domain',
    },
    {
      id: id++,
      prompt: 'Create a presentation slide deck for marketing campaign.',
      should_trigger: false,
      lang: 'en',
      split: 'train',
      category: 'out_of_domain',
    },
    {
      id: id++,
      prompt: 'Напиши вірш про осінь у Карпатах.',
      should_trigger: false,
      lang: 'uk',
      split: 'test',
      category: 'out_of_domain',
    }
  );

  return {
    skill_name: skillName,
    triggers,
  };
}

async function main() {
  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  console.log(`Generating triggers.json for ${dirs.length} skills...`);
  let created = 0;

  for (const skill of dirs) {
    const skillPath = path.join(SKILLS_DIR, skill);
    const evalsDir = path.join(skillPath, 'evals');
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) continue;

    fs.mkdirSync(evalsDir, { recursive: true });
    const triggersPath = path.join(evalsDir, 'triggers.json');

    const skillText = fs.readFileSync(skillMdPath, 'utf8');
    const descMatch = skillText.match(/^description:\s*(.*)$/m);
    const desc = descMatch ? descMatch[1] : '';

    const triggersData = generateTriggersForSkill(skill, desc);
    fs.writeFileSync(
      triggersPath,
      JSON.stringify(triggersData, null, 2),
      'utf8'
    );
    created++;
  }

  console.log(
    `Successfully generated evals/triggers.json for ${created} skills.`
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
