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
4. Do not push release tags unless invoked with explicit release flags (`-r` or `--release`).

## Command Parameters & Modes

- Regular Mode (`/git-commit` or `/commit`): SemVer Bump: None. Creates Tag: No. Appends `[skip ci]`: Yes. Triggers Actions: No (CI skipped).
- Release Mode (`/git-commit -r` or `/git-commit --release`): SemVer Bump: Auto (PATCH). Creates Tag: Yes (`v*`). Appends `[skip ci]`: No. Triggers Actions: Yes (`release.yml`, `docker.yml`).
- Release Mode (`/git-commit -r patch` | `-r minor` | `-r major`): SemVer Bump: Explicit level. Creates Tag: Yes (`v*`). Appends `[skip ci]`: No. Triggers Actions: Yes.
- Release Mode (`/git-commit --version <x.y.z>`): SemVer Bump: Exact version. Creates Tag: Yes (`v*`). Appends `[skip ci]`: No. Triggers Actions: Yes.

## Operating modes

### 1. Regular mode (Default — simply push without triggering Actions):

- **Trigger**: `/git-commit`, `/commit`, or user instruction to commit without release flags.
- **Run pre-commit check**: `pnpm verify:build`.
- **Stage modified files**: `git add .` (confirm `.env` and local secrets are excluded).
- **Author conventional commit with `[skip ci]`**:
  ```bash
  git commit -m "$(cat <<'EOF'
  <type>(<scope>): <summary> [skip ci]

  - <key change 1>
  - <key change 2>
  EOF
  )"
  ```
- **Push directly to branch**: `git push origin <branch>`.
- **Invariants**: Do NOT create git tags, do NOT pass `--tags`, and ALWAYS include `[skip ci]`. This guarantees GitHub Actions runners do not trigger on everyday development commits.

### 2. Release mode (On-demand version bump & GitHub Actions trigger):

- **Trigger**: `/git-commit -r` (or `/git-commit --release`), `/git-commit -r [patch|minor|major]`, or `/git-commit --version <x.y.z>`.
- **Run pre-commit check**: `pnpm verify:build`.
- **Bump version across monorepo**:
  ```bash
  node scripts/bump-version.mjs [patch|minor|major|<version>]
  ```
  Updates `package.json`, `Cargo.toml`, and `tauri.conf.json`.
- **Stage all changes**: `git add .`.
- **Author release commit (NO `[skip ci]`)**:
  ```bash
  git commit -m "chore(release): bump version to vX.Y.Z

  - Release SmartFeed Studio vX.Y.Z"
  ```
- **Create annotated tag**: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`.
- **Push branch and ONLY the specific release tag**:
  ```bash
  git push origin <branch> refs/tags/vX.Y.Z
  ```
- **Invariants**: NEVER pass `--tags` globally (which would push historical tags and trigger cascades of outdated workflows). Push ONLY the single new `refs/tags/vX.Y.Z`.
- **Result**: Pushing the single `vX.Y.Z` tag triggers GitHub Actions release workflows for desktop installers (`release.yml`) and Docker images (`docker.yml`).
