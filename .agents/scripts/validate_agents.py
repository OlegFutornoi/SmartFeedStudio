#!/usr/bin/env python3
"""
validate_agents.py
Validates the structural integrity, token economy, frontmatter, and rule bindings
of the SmartFeed Studio AI agent and skill system.
"""

import os
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
AGENTS_DIR = ROOT_DIR / ".agents"
RULES_DIR = AGENTS_DIR / "rules"
SKILLS_DIR = AGENTS_DIR / "skills"
AGENTS_DEF_DIR = AGENTS_DIR / "agents"

# Allowed rules that skills may bind to
VALID_RULES = {
    "core",
    "agents",
    "backend",
    "database",
    "frontend",
    "i18n",
    "testing",
    "security",
    "docs_and_ops",
}

# Master skills (budget <= 250 lines)
MASTER_SKILLS = {"frontend", "backend", "review", "git-commit", "skill-creator"}

# Utility skills (budget <= 80 lines)
UTILITY_SKILLS = {
    "find-skills",
    "firecrawl-parse",
    "image",
    "interview-me",
    "project-context-map",
    "lessons-learned-registry",
    "source-driven-development",
    "spec-driven-development",
    "context-engineering",
    "ai-sdk",
    "automated-guardrails-ci",
    "browser-debugging",
    "mock-real-parity",
    "code-simplification",
}

CYRILLIC_PATTERN = re.compile(r"[\u0400-\u04FF]")
TABLE_PATTERN = re.compile(r"^\s*\|", re.MULTILINE)

errors = []
warnings = []


def parse_frontmatter(content: str) -> dict:
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    fm_text = parts[1]
    data = {}
    current_key = None
    for line in fm_text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line and not line.startswith("-"):
            k, v = line.split(":", 1)
            current_key = k.strip()
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                data[current_key] = [item.strip().strip("'\"") for item in v[1:-1].split(",") if item.strip()]
            elif v:
                data[current_key] = v.strip("'\"")
            else:
                data[current_key] = []
        elif line.startswith("-") and current_key:
            val = line[1:].strip().strip("'\"")
            if isinstance(data.get(current_key), list):
                data[current_key].append(val)
            else:
                data[current_key] = [val]
    return data


def validate_rules():
    print("Validating .agents/rules/...")
    always_on_size = 0
    always_on_files = ["core.md", "agents.md"]

    for rule_name in VALID_RULES:
        rule_path = RULES_DIR / f"{rule_name}.md"
        if not rule_path.exists():
            errors.append(f"Missing required rule file: {rule_path}")
            continue

        text = rule_path.read_text(encoding="utf-8")
        lines = text.splitlines()
        char_count = len(text)

        if char_count > 12000:
            errors.append(f"Rule {rule_name}.md exceeds 12,000 characters limit ({char_count} chars)")

        if f"{rule_name}.md" in always_on_files:
            always_on_size += char_count
            if len(lines) > 150:
                warnings.append(f"Always-on rule {rule_name}.md is long ({len(lines)} lines)")
        else:
            if len(lines) > 250:
                warnings.append(f"Scoped rule {rule_name}.md exceeds 250 lines ({len(lines)} lines)")

        if TABLE_PATTERN.search(text):
            errors.append(f"Rule {rule_name}.md contains forbidden markdown table syntax")

    if always_on_size > 14000:
        errors.append(f"Combined always_on rules exceed 14,000 characters budget ({always_on_size} chars)")
    else:
        print(f"  Always-on rules payload: {always_on_size} characters (budget <= 14,000) - OK")


def validate_agents():
    print("Validating .agents/agents/...")
    expected_agents = ["frontend.md", "backend.md", "review.md", "qa.md", "devops.md", "security.md"]
    for agent_file in expected_agents:
        p = AGENTS_DEF_DIR / agent_file
        if not p.exists():
            errors.append(f"Missing agent definition: {p}")
            continue
        text = p.read_text(encoding="utf-8")
        lines = text.splitlines()
        if len(lines) > 150:
            warnings.append(f"Agent {agent_file} exceeds 150 lines ({len(lines)} lines)")
        if TABLE_PATTERN.search(text):
            errors.append(f"Agent {agent_file} contains forbidden markdown table syntax")


def validate_skills():
    print("Validating .agents/skills/...")
    skill_dirs = [d for d in SKILLS_DIR.iterdir() if d.is_dir()]
    print(f"  Found {len(skill_dirs)} skill directories")

    for s_dir in sorted(skill_dirs):
        skill_file = s_dir / "SKILL.md"
        if not skill_file.exists():
            errors.append(f"Missing SKILL.md in {s_dir.name}")
            continue

        text = skill_file.read_text(encoding="utf-8")
        lines = text.splitlines()
        fm = parse_frontmatter(text)

        if not fm.get("name"):
            errors.append(f"Skill {s_dir.name}/SKILL.md missing 'name' in frontmatter")
        elif fm.get("name") != s_dir.name:
            warnings.append(f"Skill {s_dir.name} has mismatched frontmatter name: '{fm.get('name')}'")

        if not fm.get("description"):
            errors.append(f"Skill {s_dir.name}/SKILL.md missing 'description' in frontmatter")

        rules = fm.get("rules")
        if not rules or not isinstance(rules, list):
            errors.append(f"Skill {s_dir.name}/SKILL.md missing valid 'rules: [...]' list in frontmatter")
        else:
            for r in rules:
                if r not in VALID_RULES:
                    errors.append(f"Skill {s_dir.name} references invalid rule '{r}'")

        # Step 0 check
        if "Step 0" not in text and "step 0" not in text.lower():
            errors.append(f"Skill {s_dir.name}/SKILL.md missing mandatory 'Step 0' rule loading section")

        # AGENT-05 & AGENT-06 checks for core implementation skills
        if s_dir.name in {"frontend", "backend", "ui-ux-pro-max"}:
            template_refs = re.findall(r"\.agents/templates/([a-zA-Z0-9_\.-]+)", text)
            if not template_refs:
                errors.append(f"Skill {s_dir.name}/SKILL.md must reference at least one golden template from .agents/templates/")
            else:
                for t_name in template_refs:
                    t_path = ROOT_DIR / ".agents" / "templates" / t_name
                    if not t_path.exists():
                        errors.append(f"Skill {s_dir.name} references non-existent template: {t_name}")

        if s_dir.name in {"frontend", "backend", "review", "ui-ux-pro-max"}:
            if "pnpm verify:fast" not in text:
                errors.append(f"Skill {s_dir.name}/SKILL.md Gate section must mandate 'pnpm verify:fast'")

        # Line budget check
        line_count = len(lines)
        if s_dir.name in MASTER_SKILLS:
            max_allowed = 250
        elif s_dir.name in UTILITY_SKILLS:
            max_allowed = 100
        else:
            max_allowed = 160

        if line_count > max_allowed:
            warnings.append(f"Skill {s_dir.name} exceeds budget ({line_count} > {max_allowed} lines)")


def validate_dispatchers():
    print("Validating dispatcher files (root AGENTS.md & .agents/AGENTS.md)...")
    root_agents = ROOT_DIR / "AGENTS.md"
    sub_agents = AGENTS_DIR / "AGENTS.md"

    if not root_agents.exists():
        errors.append("Missing root AGENTS.md")
    else:
        text = root_agents.read_text(encoding="utf-8")
        if len(text.splitlines()) > 150:
            warnings.append(f"Root AGENTS.md is long ({len(text.splitlines())} lines)")
        if TABLE_PATTERN.search(text):
            errors.append("Root AGENTS.md contains forbidden markdown table syntax")

    if not sub_agents.exists():
        errors.append("Missing .agents/AGENTS.md")
    else:
        text = sub_agents.read_text(encoding="utf-8")
        if TABLE_PATTERN.search(text):
            errors.append(".agents/AGENTS.md contains forbidden markdown table syntax")


def validate_enforcement_map():
    map_file = AGENTS_DIR / "enforcement-map.json"
    if not map_file.exists():
        errors.append("Missing .agents/enforcement-map.json")
        return

    import json

    try:
        with open(map_file, "r", encoding="utf-8") as f:
            enforcement_map = json.load(f)
    except Exception as e:
        errors.append(f"Failed to parse .agents/enforcement-map.json: {e}")
        return

    rule_id_pattern = re.compile(r"^##\s+([A-Z0-9]+-\d+):")
    defined_rules = set()
    for rule_file in RULES_DIR.glob("*.md"):
        for line in rule_file.read_text(encoding="utf-8").splitlines():
            m = rule_id_pattern.match(line)
            if m:
                defined_rules.add(m.group(1))

    unmapped = defined_rules - set(enforcement_map.keys())
    if unmapped:
        for rid in sorted(unmapped):
            errors.append(f"Rule {rid} has no entry in .agents/enforcement-map.json")
    else:
        print(f"Validated {len(defined_rules)} rule invariants against enforcement-map.json - OK")


def main():
    validate_rules()
    validate_agents()
    validate_skills()
    validate_dispatchers()
    validate_enforcement_map()

    print("\n" + "=" * 50)
    print(f"Validation summary: {len(errors)} error(s), {len(warnings)} warning(s)")
    print("=" * 50)

    if warnings:
        print("\nWarnings:")
        for w in warnings:
            print(f"  [WARN] {w}")

    if errors:
        print("\nErrors:")
        for e in errors:
            print(f"  [FAIL] {e}")
        sys.exit(1)

    print("\nAll agent and skill validation checks PASSED successfully.")
    sys.exit(0)


if __name__ == "__main__":
    main()
