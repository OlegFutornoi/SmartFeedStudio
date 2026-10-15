---
name: git-commit
description: 'Execute automated git commit & push workflow: pre-commit verification (verify:build), conventional commit, and safe remote push. By default, pushes code WITHOUT creating a new version or triggering release actions. When invoked with --release [patch|minor|major], performs automated SemVer bumping, file synchronization, git tag creation, and push with tags to trigger release workflows. Use when user asks to commit, push, or mentions "/git-commit", "/commit", or release requests.'
license: MIT
allowed-tools: Bash
---

# Git Commit: Controlled Push & On-Demand Release Workflow

## 📌 Overview & Operating Modes

The `git-commit` workflow supports two distinct modes to prevent accidental app version bumps and unnecessary CI/CD release builds:

1. **Regular Mode (Default — No Action / No Version Bump)**:
   - Invocation: `/git-commit`, `/commit`, _"закоміть"_, _"вивантаж"_, _"зроби коміт"_.
   - Runs `pnpm verify:build` → stages changes → generates Conventional Commit → pushes strictly to branch (`git push origin <branch>`).
   - **NO git tags are created** and **NO `--tags` are pushed**.
   - **Result**: GitHub Actions `release.yml` and `docker.yml` **DO NOT trigger**. No new app version is created.

2. **Release Mode (On-Demand — Version Bump & Release Action)**:
   - Invocation: `/git-commit --release` (or `-r`), `/git-commit --release [patch|minor|major]`, `/git-commit --version <x.y.z>`, or explicit user request (_"випусти реліз"_, _"створи нову версію додатку"_, _"закоміть з релізом"_).
   - Runs `pnpm verify:build` → bumps & syncs version across `package.json`, `Cargo.toml`, `tauri.conf.json` → commits release → creates annotated tag `vX.Y.Z` → pushes branch and tag.
   - **Result**: Pushing tag `v*` triggers GitHub Actions `Release Desktop App` (`release.yml`) and `Publish Docker Images` (`docker.yml`).

3. **Optional Flag `--skip-ci`**:
   - Invocation: `/git-commit --skip-ci` or _"вивантаж без CI"_.
   - Appends `[skip ci]` to the commit message so GitHub Actions bypasses even standard CI verification runners.

---

## 🎛️ Command Parameters & Syntax

| Command / Flag                 | Mode    | SemVer Bump    | Creates Git Tag? | Triggers Release Action? |
| :----------------------------- | :------ | :------------- | :--------------- | :----------------------- |
| `/git-commit`                  | Regular | None           | ❌ No            | ❌ No                    |
| `/commit`                      | Regular | None           | ❌ No            | ❌ No                    |
| `/git-commit --skip-ci`        | Regular | None           | ❌ No            | ❌ No (Skips all CI)     |
| `/git-commit --release`        | Release | Auto (PATCH)   | ✅ Yes (`v*`)    | ✅ Yes (`release.yml`)   |
| `/git-commit --release patch`  | Release | PATCH (+0.0.1) | ✅ Yes (`v*`)    | ✅ Yes (`release.yml`)   |
| `/git-commit --release minor`  | Release | MINOR (+0.1.0) | ✅ Yes (`v*`)    | ✅ Yes (`release.yml`)   |
| `/git-commit --release major`  | Release | MAJOR (+1.0.0) | ✅ Yes (`v*`)    | ✅ Yes (`release.yml`)   |
| `/git-commit --version 1.20.0` | Release | Exact Version  | ✅ Yes (`v*`)    | ✅ Yes (`release.yml`)   |

---

## 🚀 Execution Pipelines

### 🅰️ Pipeline 1: Regular Mode (Default / Simply Push Without Action)

Execute sequentially when `/git-commit` is called without release flags:

#### 0. Pre-Commit Integrity Gate

```bash
pnpm verify:build
```

> If any compilation, typing, or build error occurs — **STOP**, fix root cause, and re-run.

#### 1. Stage Modified Files Safely

```bash
git add .
```

_(Verify that secrets such as `.env` are excluded)._

#### 2. Generate Conventional Commit

```bash
git commit -m "$(cat <<'EOF'
<type>[scope]: <short description>

<bullet points detailing key changes>
EOF
)"
```

_(If `--skip-ci` was requested, append `[skip ci]` to the first line or footer)._

#### 3. Plain Push to Remote (Zero Tags)

```bash
git push origin <current-branch>
```

> 🛑 **CRITICAL**: Do NOT run `git tag` and do NOT pass `--tags`. This guarantees no release action runs.

---

### 🅱️ Pipeline 2: Release Mode (`--release` / `--version`)

Execute sequentially when the user passes `--release`, `--version`, or requests a version bump:

#### 0. Pre-Commit Integrity Gate

```bash
pnpm verify:build
```

#### 1. Calculate Next Version & Synchronize Configuration

Run the automated version synchronization script:

```bash
node scripts/bump-version.mjs [patch|minor|major|<version>]
```

This automatically updates:

- `apps/desktop/src-tauri/tauri.conf.json` (`version`)
- `apps/desktop/src-tauri/Cargo.toml` (`version = "..."`)
- `apps/desktop/package.json` (`version`)
- Root `package.json` (`version`)

#### 2. Stage All Changes (Including Updated Configs)

```bash
git add .
```

#### 3. Commit Release Bump

```bash
git commit -m "chore(release): bump version to vX.Y.Z

- Release SmartFeed Studio vX.Y.Z
- Synchronized package.json, Cargo.toml, and tauri.conf.json"
```

#### 4. Create Annotated Git Tag

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z: <Release Summary>"
```

#### 5. Push Branch and Release Tag to Remote

```bash
git push origin <current-branch> && git push origin vX.Y.Z
```

> 🚀 Pushing the `v*` tag activates GitHub Actions `Release Desktop App` (`release.yml`) to build multi-platform installers (.dmg, .exe, .msi, .deb) and `Publish Docker Images` (`docker.yml`).

---

## 🛡️ Git Safety Protocol

1. **Explicit Invocation Only**: NEVER run `git commit` or `git push` autonomously without explicit user prompt (`/git-commit`, `/commit`, _"закоміть"_, _"вивантаж"_).
2. **Tag Prohibition in Regular Mode**: NEVER create or push tags during regular commits. Tags are reserved strictly for `--release`.
3. **No Destructive Operations**: NEVER run `--force`, `reset --hard`, or rebase shared branches without permission.
4. **Pre-Push Gate Zero Bypass**: NEVER bypass `pnpm verify:build` with `--no-verify`.
