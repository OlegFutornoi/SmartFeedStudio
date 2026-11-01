import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, TABLE_PATTERN } from './helpers.mjs';

export function validateRules(RULES_DIR, VALID_RULES, errors, warnings) {
  let alwaysOnChars = 0;
  const alwaysOnFiles = new Set(['core.md', 'agents.md']);

  for (const rule of VALID_RULES) {
    const rulePath = path.join(RULES_DIR, `${rule}.md`);
    if (!fs.existsSync(rulePath)) {
      errors.push(`[RULE] Missing required rule file: .agents/rules/${rule}.md`);
      continue;
    }

    const text = fs.readFileSync(rulePath, 'utf8');
    const lines = text.split(/\r?\n/);
    const charCount = text.length;
    const fm = parseFrontmatter(text);

    if (fm && fm.trigger === 'glob') {
      if (!fm.globs || typeof fm.globs !== 'string') {
        errors.push(
          `[RULE] ${rule}.md with trigger: glob must define 'globs' as a string`
        );
      }
    }

    if (charCount > 12000) {
      errors.push(
        `[RULE] ${rule}.md exceeds 12,000 characters limit (${charCount} chars)`
      );
    }

    if (TABLE_PATTERN.test(text)) {
      errors.push(`[RULE] ${rule}.md contains forbidden markdown table syntax`);
    }

    if (alwaysOnFiles.has(`${rule}.md`)) {
      alwaysOnChars += charCount;
      if (lines.length > 150) {
        warnings.push(`Always-on rule ${rule}.md is long (${lines.length} lines)`);
      }
    } else {
      if (lines.length > 250) {
        warnings.push(`Scoped rule ${rule}.md exceeds 250 lines (${lines.length} lines)`);
      }
    }
  }

  if (alwaysOnChars > 14000) {
    errors.push(
      `[RULE] Combined always-on rules exceed 14,000 chars budget (${alwaysOnChars} chars)`
    );
  }

  return alwaysOnChars;
}

export function validateSkills(
  SKILLS_DIR,
  AGENTS_DIR,
  REPO_ROOT,
  AGENTS_MD,
  VALID_RULES,
  MASTER_SKILLS,
  UTILITY_SKILLS,
  errors,
  warnings
) {
  const skillDirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const agentsMdText = fs.existsSync(AGENTS_MD)
    ? fs.readFileSync(AGENTS_MD, 'utf8')
    : '';

  for (const skill of skillDirs) {
    const skillMd = path.join(SKILLS_DIR, skill, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      errors.push(`[SKILL] Missing SKILL.md in .agents/skills/${skill}`);
      continue;
    }

    const text = fs.readFileSync(skillMd, 'utf8');
    const lines = text.split(/\r?\n/);
    const fm = parseFrontmatter(text);

    if (!fm || !fm.name) {
      errors.push(`[SKILL] Skill ${skill}/SKILL.md missing 'name' in frontmatter`);
    } else if (fm.name !== skill) {
      warnings.push(`[SKILL] Skill ${skill} has mismatched frontmatter name '${fm.name}'`);
    }

    if (!fm || !fm.description) {
      errors.push(`[SKILL] Skill ${skill}/SKILL.md missing 'description' in frontmatter`);
    }

    const rules = fm ? fm.rules : null;
    if (!rules || !Array.isArray(rules)) {
      errors.push(`[SKILL] Skill ${skill}/SKILL.md missing 'rules: [...]' list`);
    } else {
      for (const r of rules) {
        if (!VALID_RULES.has(r)) {
          errors.push(`[SKILL] Skill ${skill} references invalid rule '${r}'`);
        }
      }
    }

    // Step 0 rule loading check
    if (!text.toLowerCase().includes('step 0')) {
      errors.push(`[SKILL] Skill ${skill}/SKILL.md missing mandatory 'Step 0' section`);
    }

    // Golden template checks for core implementation skills
    if (skill === 'frontend' || skill === 'backend' || skill === 'ui-ux-pro-max') {
      const templateRefs = text.match(/\.agents\/templates\/([a-zA-Z0-9_.-]+)/g) || [];
      if (templateRefs.length === 0) {
        errors.push(`[SKILL] Skill ${skill}/SKILL.md must reference at least one golden template`);
      } else {
        for (const tRef of templateRefs) {
          const tPath = path.join(REPO_ROOT, tRef);
          if (!fs.existsSync(tPath)) {
            errors.push(`[SKILL] Skill ${skill} references non-existent template: ${tRef}`);
          }
        }
      }
    }

    // verify:fast mandate in Gate section
    if (['frontend', 'backend', 'review', 'ui-ux-pro-max'].includes(skill)) {
      if (!text.includes('pnpm verify:fast')) {
        errors.push(`[SKILL] Skill ${skill}/SKILL.md Gate section must mandate 'pnpm verify:fast'`);
      }
    }

    // Line budgets
    const lineCount = lines.length;
    let maxAllowed = 160;
    if (MASTER_SKILLS.has(skill)) maxAllowed = 250;
    else if (UTILITY_SKILLS.has(skill)) maxAllowed = 100;

    if (lineCount > maxAllowed) {
      warnings.push(`Skill ${skill} exceeds budget (${lineCount} > ${maxAllowed} lines)`);
    }

    // Index in .agents/AGENTS.md
    if (!agentsMdText.includes(`\`${skill}\``)) {
      errors.push(`[INDEX] Skill "${skill}" is not indexed in .agents/AGENTS.md`);
    }
  }

  return skillDirs;
}

