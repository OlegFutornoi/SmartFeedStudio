---
name: find-skills
description: Discovers and installs skills from the open agent skills ecosystem using the Skills CLI. Use when searching for specialized third-party agent capabilities or tooling templates.
rules:
  - core
---

# Find Skills

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`.
2. Review existing skills in `.agents/skills/` to prevent duplicate installations.
3. Do not install unverified third-party skills without user confirmation.

## Discovery instructions

1. Search ecosystem: Run `npx skills find <query>` to search the open skill catalog.
2. Verification criteria:
   - Favor official and reputable sources (`vercel-labs`, `anthropics`, `microsoft`).
   - Verify install counts and repository activity before recommending a skill.
3. Installation: Install verified skills via `npx skills add <package>`. Update `.agents/AGENTS.md` dispatcher if a newly installed skill becomes an active project dependency.
