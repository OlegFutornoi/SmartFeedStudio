import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, TABLE_PATTERN } from './helpers.mjs';

export function validateAgents(SUBAGENTS_DIR, AGENTS_DIR, errors, warnings) {
  const expectedAgents = [
    'planner.md',
    'frontend.md',
    'backend.md',
    'review.md',
    'qa.md',
    'devops.md',
    'security.md',
  ];

  for (const af of expectedAgents) {
    const agentPath = path.join(SUBAGENTS_DIR, af);
    if (!fs.existsSync(agentPath)) {
      errors.push(`[SUBAGENT] Missing agent definition: .agents/agents/${af}`);
      continue;
    }

    const text = fs.readFileSync(agentPath, 'utf8');
    const lines = text.split(/\r?\n/);
    const fm = parseFrontmatter(text);

    if (lines.length > 150) {
      warnings.push(`Agent ${af} exceeds 150 lines budget (${lines.length} lines)`);
    }
    if (TABLE_PATTERN.test(text)) {
      errors.push(`[SUBAGENT] Agent ${af} contains forbidden markdown table syntax`);
    }

    const expectedName = af.replace(/\.md$/, '');
    if (
      !fm ||
      fm.name !== expectedName ||
      !fm.description ||
      String(fm.subagent) !== 'true'
    ) {
      errors.push(
        `[SUBAGENT] Invalid frontmatter in .agents/agents/${af} (requires name: ${expectedName}, description, subagent: true)`
      );
      continue;
    }

    if (Array.isArray(fm.skills)) {
      for (const sRef of fm.skills) {
        const resolvedSkill = path.join(AGENTS_DIR, sRef, 'SKILL.md');
        if (!fs.existsSync(resolvedSkill)) {
          errors.push(
            `[SUBAGENT] Agent ${af} references missing skill file "${sRef}/SKILL.md"`
          );
        }
      }
    }
  }
}

export function validateEnforcement(ENFORCEMENT_MAP_PATH, RULES_DIR, VALID_RULES, errors) {
  if (!fs.existsSync(ENFORCEMENT_MAP_PATH)) {
    errors.push('[ENFORCEMENT] Missing .agents/enforcement-map.json');
    return;
  }
  try {
    const map = JSON.parse(fs.readFileSync(ENFORCEMENT_MAP_PATH, 'utf8'));
    const definedRules = new Set();

    for (const rule of VALID_RULES) {
      const rPath = path.join(RULES_DIR, `${rule}.md`);
      if (!fs.existsSync(rPath)) continue;
      const rText = fs.readFileSync(rPath, 'utf8');
      for (const line of rText.split(/\r?\n/)) {
        const m = line.match(/^##\s+([A-Z0-9]+-\d+):/);
        if (m) definedRules.add(m[1]);
      }
    }

    for (const rid of definedRules) {
      if (!map[rid]) {
        errors.push(`[ENFORCEMENT] Rule ${rid} has no entry in .agents/enforcement-map.json`);
      }
    }
  } catch (err) {
    errors.push(`[ENFORCEMENT] Failed to parse enforcement-map.json: ${err.message}`);
  }
}

export function validateActiveTask(AGENTS_DIR, errors) {
  const activeTaskPath = path.join(AGENTS_DIR, 'state/active_task.json');
  if (fs.existsSync(activeTaskPath)) {
    try {
      const task = JSON.parse(fs.readFileSync(activeTaskPath, 'utf8'));
      const required = ['active_task_id', 'status', 'branch', 'current_stage'];
      for (const field of required) {
        if (task[field] === undefined || task[field] === null) {
          errors.push(`[STATE] .agents/state/active_task.json missing required field '${field}'`);
        }
      }
    } catch (err) {
      errors.push(`[STATE] Invalid JSON in .agents/state/active_task.json: ${err.message}`);
    }
  }
}

