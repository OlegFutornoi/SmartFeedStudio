import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, TABLE_PATTERN, walk } from './helpers.mjs';

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

  // Collect rules lines >= 60 chars for duplicate detection (CORE Invariant & Task 2.2)
  const RULES_DIR = path.join(AGENTS_DIR, 'rules');
  const ruleLines = new Set();
  for (const r of VALID_RULES) {
    const rPath = path.join(RULES_DIR, `${r}.md`);
    if (!fs.existsSync(rPath)) continue;
    const rLines = fs.readFileSync(rPath, 'utf8').split(/\r?\n/);
    for (const l of rLines) {
      const trimmed = l.trim();
      if (trimmed.length >= 60 && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
        ruleLines.add(trimmed.toLowerCase());
      }
    }
  }

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
    } else {
      if (fm.description.length > 1024) {
        errors.push(`[SKILL] Skill ${skill} description exceeds 1024 characters budget (${fm.description.length} chars)`);
      }
      if (!fm.description.includes('Use when')) {
        errors.push(`[SKILL] Skill ${skill} description missing mandatory 'Use when' trigger phrase`);
      }
      if (!fm.description.includes('Do not use for')) {
        errors.push(`[SKILL] Skill ${skill} description missing mandatory 'Do not use for' negative trigger phrase`);
      }
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

    // Task 2.2: Duplicate lines check against rules/*.md
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.length >= 60 && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('- [ ]') && !trimmed.startsWith('1. Read')) {
        if (ruleLines.has(trimmed.toLowerCase())) {
          warnings.push(`[DUPLICATE-RULE] Skill ${skill} duplicates exact line from rules: "${trimmed.slice(0, 50)}..."`);
        }
      }
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

    // Task 3.6: Check for forbidden nested AGENTS.md inside skill
    const skillNestedAgents = walk(path.join(SKILLS_DIR, skill)).filter(
      (f) => path.basename(f) === 'AGENTS.md'
    );
    if (skillNestedAgents.length > 0) {
      errors.push(
        `[SKILL] Forbidden nested AGENTS.md in skill ${skill}: ${skillNestedAgents.map((f) => path.relative(REPO_ROOT, f)).join(', ')}`
      );
    }

    // Task 3.6: Check for orphan files in references/
    const refsDir = path.join(SKILLS_DIR, skill, 'references');
    if (fs.existsSync(refsDir)) {
      const refEntries = fs.readdirSync(refsDir);
      for (const rf of refEntries) {
        if (rf.startsWith('.') || rf.startsWith('_')) continue;
        if (!text.includes(rf)) {
          errors.push(`[ORPHAN] Skill ${skill} has unreferenced file in references/: ${rf}`);
        }
      }
    }

    // Check for forbidden Cyrillic characters across skill files (excluding evals/*.json)
    const skillFiles = walk(path.join(SKILLS_DIR, skill));
    for (const sf of skillFiles) {
      const rel = path.relative(path.join(SKILLS_DIR, skill), sf);
      if (rel.startsWith('evals/') && rel.endsWith('.json')) continue;
      if (/\.(md|mjs|js|json|toml)$/.test(sf)) {
        const content = fs.readFileSync(sf, 'utf8');
        if (/[\u0400-\u04FF]/.test(content)) {
          errors.push(`[CYRILLIC] Skill file .agents/skills/${skill}/${rel} contains forbidden Cyrillic characters`);
        }
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

    // Evals validation (.agents/skills/<skill>/evals/evals.json)
    const evalsPath = path.join(SKILLS_DIR, skill, 'evals/evals.json');
    if (!fs.existsSync(evalsPath)) {
      errors.push(`[EVALS] Skill ${skill} missing evals/evals.json`);
    } else {
      try {
        const suite = JSON.parse(fs.readFileSync(evalsPath, 'utf8'));
        if (suite.skill_name !== skill) {
          errors.push(`[EVALS] Skill ${skill}/evals/evals.json skill_name mismatch: "${suite.skill_name}" !== "${skill}"`);
        }
        if (!Array.isArray(suite.evals) || suite.evals.length < 3) {
          errors.push(`[EVALS] Skill ${skill}/evals/evals.json must have >= 3 cases`);
        } else {
          for (const c of suite.evals) {
            const expList = c.expectations || c.assertions;
            if (!c.id || !c.prompt || !c.expected_output || !Array.isArray(expList) || expList.length < 2) {
              errors.push(`[EVALS] Skill ${skill} eval case #${c.id || '?'} missing required fields or has < 2 expectations`);
            }
          }
        }
      } catch (err) {
        errors.push(`[EVALS] Skill ${skill}/evals/evals.json invalid JSON: ${err.message}`);
      }
    }

    // Triggers validation (.agents/skills/<skill>/evals/triggers.json)
    const triggersPath = path.join(SKILLS_DIR, skill, 'evals/triggers.json');
    if (!fs.existsSync(triggersPath)) {
      errors.push(`[TRIGGERS] Skill ${skill} missing evals/triggers.json`);
    } else {
      try {
        const trg = JSON.parse(fs.readFileSync(triggersPath, 'utf8'));
        if (trg.skill_name !== skill) {
          errors.push(`[TRIGGERS] Skill ${skill}/evals/triggers.json skill_name mismatch: "${trg.skill_name}" !== "${skill}"`);
        }
        if (!Array.isArray(trg.triggers) || trg.triggers.length < 10) {
          errors.push(`[TRIGGERS] Skill ${skill}/evals/triggers.json must have >= 10 triggers (found ${trg.triggers?.length || 0})`);
        } else {
          const pos = trg.triggers.filter((t) => t.should_trigger === true);
          const neg = trg.triggers.filter((t) => t.should_trigger === false);
          const posUk = pos.filter((t) => t.lang === 'uk');
          const posEn = pos.filter((t) => t.lang === 'en');
          const adjacent = neg.filter((t) => t.category === 'adjacent' && t.expected_skill);
          const train = trg.triggers.filter((t) => t.split === 'train');
          const test = trg.triggers.filter((t) => t.split === 'test');

          if (pos.length < 5) errors.push(`[TRIGGERS] Skill ${skill} must have >= 5 positive triggers (found ${pos.length})`);
          if (neg.length < 5) errors.push(`[TRIGGERS] Skill ${skill} must have >= 5 negative triggers (found ${neg.length})`);
          if (posUk.length < 2) errors.push(`[TRIGGERS] Skill ${skill} must have >= 2 UK positive triggers`);
          if (posEn.length < 2) errors.push(`[TRIGGERS] Skill ${skill} must have >= 2 EN positive triggers`);
          if (adjacent.length < 2) errors.push(`[TRIGGERS] Skill ${skill} must have >= 2 adjacent negative triggers with expected_skill`);
          if (train.length === 0 || test.length === 0) errors.push(`[TRIGGERS] Skill ${skill} must define both train and test splits`);
        }
      } catch (err) {
        errors.push(`[TRIGGERS] Skill ${skill}/evals/triggers.json invalid JSON: ${err.message}`);
      }
    }
  }

  return skillDirs;
}

