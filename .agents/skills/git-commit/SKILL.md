---
name: git-commit
description: 'Execute automated end-to-end git commit workflow: intelligent staging, conventional commit generation, automatic SemVer release version tagging, and push with tags to remote. Use when user asks to commit changes, create a git commit, or mentions "/git-commit" or "/commit".'
license: MIT
allowed-tools: Bash
---

# Git Commit with Conventional Commits, Automated Release Tagging & Push

## Overview

Execute the complete, automated end-to-end git release workflow upon explicit user request (`/git-commit` or `/commit`):

1. **Analyze & Stage**: Stage modified and untracked files safely (`git add .`).
2. **Conventional Commit**: Generate and execute semantic Conventional Commit message based on the diff.
3. **Automated SemVer Tagging**: Calculate the next version tag and create an annotated tag (`git tag -a vX.Y.Z -m "Release vX.Y.Z: ..."`).
4. **Push with Tags**: Automatically push both the commit and all tags to remote (`git push origin <branch> --tags`).

---

## Conventional Commit Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

---

## Commit Types & SemVer Impact

| Type       | Purpose                        | SemVer Impact | Version Bump Example |
| :--------- | :----------------------------- | :------------ | :------------------- |
| `feat`     | New feature                    | MINOR         | `v1.8.0` → `v1.9.0`  |
| `fix`      | Bug fix                        | PATCH         | `v1.8.0` → `v1.8.1`  |
| `refactor` | Code refactor (no feature/fix) | PATCH         | `v1.8.0` → `v1.8.1`  |
| `perf`     | Performance improvement        | PATCH         | `v1.8.0` → `v1.8.1`  |
| `docs`     | Documentation only             | PATCH         | `v1.8.0` → `v1.8.1`  |
| `style`    | Formatting/style (no logic)    | PATCH         | `v1.8.0` → `v1.8.1`  |
| `test`     | Add/update tests               | PATCH         | `v1.8.0` → `v1.8.1`  |
| `build`    | Build system/dependencies      | PATCH         | `v1.8.0` → `v1.8.1`  |
| `ci`       | CI/config changes              | PATCH         | `v1.8.0` → `v1.8.1`  |
| `chore`    | Maintenance/misc               | PATCH         | `v1.8.0` → `v1.8.1`  |

> **Breaking Changes** (`feat!` or `BREAKING CHANGE:` footer) trigger a **MAJOR** version bump: `v1.8.0` → `v2.0.0`.

---

## ⚡ Mandatory 4-Step Automated Execution Pipeline

Whenever the user invokes `/git-commit` (or `/commit`), execute all 4 steps sequentially without stopping midway:

### 1. Stage Modified Files

```bash
git add .
```

_(Verify that secrets such as `.env`, certificates, or credentials are not staged)._

### 2. Generate & Execute Conventional Commit

```bash
git commit -m "$(cat <<'EOF'
<type>[scope]: <short description>

<bullet points detailing key changes>
EOF
)"
```

### 3. Determine Next SemVer Version & Create Annotated Tag

Check the latest tag:

```bash
git tag -l --sort=-v:refname | head -5
```

Calculate the next version (`vX.Y.Z`) based on the highest SemVer impact from the commit type:

- **MAJOR** if breaking change (`feat!`)
- **MINOR** if new feature (`feat`)
- **PATCH** if bug fix, refactoring, quality hardening, or docs (`fix`, `refactor`, `perf`, `docs`)

Create the annotated tag:

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z: <Short description of release>"
```

_Example:_

```bash
git tag -a v1.8.1 -m "Release v1.8.1: Navigation & upsell refinement, API modularization and quality hardening"
```

### 4. Push Commit and All Tags to Remote

```bash
git push origin <current-branch> --tags
```

_Example for main branch:_

```bash
git push origin main --tags
```

> **Single-Command Pipeline Example:**
>
> ```bash
> git tag -a v1.8.1 -m "Release v1.8.1: Navigation & upsell refinement, API modularization and quality hardening" && git push origin main --tags
> ```

---

## 🛡️ Git Safety Protocol

- NEVER run git commit or git push autonomously without explicit user invocation (`/git-commit`, `/commit`, _"вивантаж"_, _"закоміть"_).
- When `/git-commit` IS invoked, ALWAYS perform the complete sequence: Commit → Tag → Push with tags.
- NEVER update git config without permission.
- NEVER run destructive commands (`--force`, `reset --hard`) without explicit request.
- NEVER skip hooks (`--no-verify`) unless explicitly asked.
- If pre-push verification fails, investigate the root cause, fix the compilation/test issue, and re-run.
