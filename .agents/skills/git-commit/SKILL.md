---
name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, message generation, and release version tagging. Use when user asks to commit changes, create a git commit, or mentions "/commit". Supports: (1) Auto-detecting type and scope from changes, (2) Generating conventional commit messages from diff, (3) Release version tagging (SemVer tag creation and push), (4) Interactive commit with optional type/scope/description overrides, (5) Intelligent file staging for logical grouping'
license: MIT
allowed-tools: Bash
---

# Git Commit with Conventional Commits & Release Tagging

## Overview

Create standardized, semantic git commits using the Conventional Commits specification. Analyze the actual diff to determine appropriate type, scope, and message, and automatically handle release version tagging when requested.

---

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

---

## Commit Types

| Type       | Purpose                        | SemVer Impact |
| :--------- | :----------------------------- | :------------ |
| `feat`     | New feature                    | MINOR (0.X.0) |
| `fix`      | Bug fix                        | PATCH (0.0.X) |
| `docs`     | Documentation only             | PATCH (0.0.X) |
| `style`    | Formatting/style (no logic)    | PATCH (0.0.X) |
| `refactor` | Code refactor (no feature/fix) | PATCH (0.0.X) |
| `perf`     | Performance improvement        | PATCH (0.0.X) |
| `test`     | Add/update tests               | PATCH (0.0.X) |
| `build`    | Build system/dependencies      | PATCH (0.0.X) |
| `ci`       | CI/config changes              | PATCH (0.0.X) |
| `chore`    | Maintenance/misc               | PATCH (0.0.X) |
| `revert`   | Revert commit                  | PATCH (0.0.X) |

---

## Breaking Changes

```
# Exclamation mark after type/scope (triggers MAJOR version bump)
feat!: remove deprecated endpoint

# BREAKING CHANGE footer
feat: allow config to extend other configs

BREAKING CHANGE: `extends` key behavior changed
```

---

## 🏷️ Release Version Tagging Workflow

Whenever committing milestone features, significant updates, or when requested by the user:

1. **Check Existing Tags & Determine Next SemVer Version**:

   ```bash
   git tag -l --sort=-v:refname | head -5
   ```
   - **MAJOR** (`vX+1.0.0`): Breaking changes (`BREAKING CHANGE` or `feat!`).
   - **MINOR** (`vX.Y+1.0`): New features (`feat`).
   - **PATCH** (`vX.Y.Z+1`): Bug fixes, refactoring, docs, styling (`fix`, `refactor`, `perf`, `docs`).

2. **Create the Tag**:

   ```bash
   # Lightweight or annotated tag
   git tag vX.Y.Z
   # OR with annotation
   git tag -a vX.Y.Z -m "Release vX.Y.Z: <Short description of release>"
   ```

3. **Push Commit and Tag**:
   ```bash
   # Push current branch
   git push origin <branch-name>

   # Push the release tag
   git push origin vX.Y.Z
   # OR push all tags
   git push origin --tags
   ```

---

## Complete Workflow

### 1. Analyze Diff & Staging

```bash
# Check status and working tree
git status --porcelain
git diff --staged
git diff
```

### 2. Stage Files

```bash
# Stage specific files or directories
git add path/to/file1 path/to/file2
git add .
```

> **Never commit secrets** (`.env`, credentials, private keys, certificates).

### 3. Generate & Execute Commit

```bash
git commit -m "$(cat <<'EOF'
<type>[scope]: <description>

<optional body with bullet points>

<optional footer or references>
EOF
)"
```

### 4. Apply & Push Release Tag (When applicable)

```bash
git tag vX.Y.Z
git push origin <branch> --tags
```

---

## Git Safety Protocol

- NEVER update git config without permission
- NEVER run destructive commands (`--force`, hard reset) without explicit request
- NEVER skip hooks (`--no-verify`) unless user asks
- NEVER force push to main/master
- If commit fails due to hooks, fix issues and create a clean commit
