import fs from 'node:fs';
import path from 'node:path';

const MAX_SKILL_CHARS = 24000;

export function loadAllSuites(skillsDir, filterSkills = []) {
  const dirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
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
    const evalPath = path.join(skillsDir, skill, 'evals/evals.json');
    const triggersPath = path.join(skillsDir, skill, 'evals/triggers.json');
    const skillMdPath = path.join(skillsDir, skill, 'SKILL.md');

    let suite = null;
    let triggers = null;
    let evalError = null;
    let triggerError = null;

    if (fs.existsSync(evalPath)) {
      try {
        suite = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
      } catch (err) {
        evalError = `Invalid JSON in evals.json: ${err.message}`;
      }
    } else {
      evalError = 'Missing evals/evals.json';
    }

    if (fs.existsSync(triggersPath)) {
      try {
        triggers = JSON.parse(fs.readFileSync(triggersPath, 'utf8'));
      } catch (err) {
        triggerError = `Invalid JSON in triggers.json: ${err.message}`;
      }
    } else {
      triggerError = 'Missing evals/triggers.json';
    }

    const skillMd = fs.existsSync(skillMdPath)
      ? fs.readFileSync(skillMdPath, 'utf8').slice(0, MAX_SKILL_CHARS)
      : '';

    results.push({
      skill,
      evalPath,
      triggersPath,
      skillMdPath,
      suite,
      triggers,
      skillMd,
      evalError,
      triggerError,
    });
  }
  return results;
}

export function dryRunValidation(suites) {
  const errors = [];
  let validCount = 0;
  let totalCases = 0;

  for (const { skill, suite, triggers, evalError, triggerError } of suites) {
    if (evalError) {
      errors.push(`[${skill}] ${evalError}`);
      continue;
    }
    if (triggerError) {
      errors.push(`[${skill}] ${triggerError}`);
      continue;
    }
    if (!suite) {
      errors.push(`[${skill}] Missing suite`);
      continue;
    }
    if (suite.skill_name !== skill) {
      errors.push(`[${skill}] skill_name "${suite.skill_name}" !== dir "${skill}"`);
    }
    if (!Array.isArray(suite.evals) || suite.evals.length < 3) {
      errors.push(`[${skill}] Must contain at least 3 eval cases`);
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
    }

    if (!triggers || !Array.isArray(triggers.triggers) || triggers.triggers.length < 10) {
      errors.push(`[${skill}] Must contain at least 10 triggers in triggers.json`);
    } else {
      const pos = triggers.triggers.filter((t) => t.should_trigger === true);
      const neg = triggers.triggers.filter((t) => t.should_trigger === false);
      const posUk = pos.filter((t) => t.lang === 'uk');
      const posEn = pos.filter((t) => t.lang === 'en');
      const adjacent = neg.filter((t) => t.category === 'adjacent' && t.expected_skill);
      const train = triggers.triggers.filter((t) => t.split === 'train');
      const test = triggers.triggers.filter((t) => t.split === 'test');

      if (pos.length < 5) errors.push(`[${skill}] Must contain >= 5 positive triggers`);
      if (neg.length < 5) errors.push(`[${skill}] Must contain >= 5 negative triggers`);
      if (posUk.length < 2) errors.push(`[${skill}] Must contain >= 2 UK positive triggers`);
      if (posEn.length < 2) errors.push(`[${skill}] Must contain >= 2 EN positive triggers`);
      if (adjacent.length < 2) errors.push(`[${skill}] Must contain >= 2 adjacent negative triggers`);
      if (train.length === 0 || test.length === 0) errors.push(`[${skill}] Must define train and test splits`);
    }

    if (errors.length === 0) {
      validCount++;
      totalCases += suite.evals.length;
    }
  }

  return { errors, validCount, totalCases };
}

