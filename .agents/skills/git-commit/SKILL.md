---
name: git-commit
description: Controlled git commit and release workflow. Enforces pre-commit build verification, Conventional Commits, plain branch pushes, and on-demand SemVer release tagging.
rules:
  - core
  - docs_and_ops
  - testing
---

# Git Commit and Controlled Release Workflow

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/docs_and_ops.md`, and `.agents/rules/testing.md`.
2. Note git commit invariants (CORE-10: never commit without explicit user instruction).
3. Confirm working tree status before staging files.
4. Do not push release tags unless invoked with explicit release flags.

## Operating modes

1. Regular mode (default push without tag):
   - Trigger: `/git-commit`, `/commit`, or user instruction to commit or push.
   - Run pre-commit build verification: `pnpm verify:build`.
   - Stage modified files: `git add .` (confirm `.env` and local secrets are excluded).
   - Author conventional commit: `<type>(<scope>): <summary>` followed by concise bullet points.
   - Push directly to branch: `git push origin <branch>`.
   - Do not create git tags and do not pass `--tags`. This prevents triggering release workflows.
2. Release mode (on-demand version bump and release):
   - Trigger: `/git-commit --release [patch|minor|major]` or `/git-commit --version <x.y.z>`.
   - Run pre-commit build verification: `pnpm verify:build`.
   - Bump and synchronize versions across `package.json`, `Cargo.toml`, and `tauri.conf.json`.
   - Commit changes: `chore(release): bump version to vX.Y.Z`.
   - Create annotated tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
   - Push branch and tag: `git push origin <branch> --tags`.
   - Result: Pushing `v*` tag triggers GitHub Actions release workflows for desktop client and Docker images.
3. Skip CI flag:
   - When requested via `--skip-ci`, append `[skip ci]` to the commit message to bypass standard CI runners.
