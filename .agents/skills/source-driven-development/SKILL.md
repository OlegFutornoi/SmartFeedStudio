---
name: source-driven-development
description: Context7 documentation protocol for grounding library APIs via MCP tools or ctx7 CLI. Use when adopting new libraries, designing non-trivial framework integrations, verifying version-specific APIs, or troubleshooting unfamiliar SDK behavior. Do not use for standard language primitives, trivial utilities, or repetitive internal refactoring.
rules:
  - core
---

# Source-Driven Development

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and enforce invariant `CORE-06`.
2. Inspect `package.json` or `Cargo.toml` to identify exact dependency versions.
3. Determine whether research is required: skip for standard language primitives and internal project modules; trigger for external libraries, version migrations, or unfamiliar API signatures.

## Two-Step Context7 Workflow

Fetch documentation using either native MCP tools or the local `ctx7` CLI.

### Step 1: Resolve Library Name to ID

- MCP: `context7.resolve-library-id { libraryName: "<name>", query: "<specific concept>" }`
- CLI: `ctx7 library <name> "<specific concept>"` (or with `--json` for scripted parsing).
- Selection criteria: Pick highest benchmark score, strong source reputation (High/Medium), and match exact project version from `package.json`.

### Step 2: Query Documentation

- MCP: `context7.query-docs { libraryId: "<id>", query: "<specific concept>" }`
- CLI: `ctx7 docs <libraryId> "<specific concept>"` (pipe to `head -n 50`, `grep`, or `--json`).
- Query scoping: Formulate natural-language intent (e.g., "How to configure cascade delete with one-to-many relation"), never generic single-word tokens like "auth" or "delete".

## Domain Query Directory

1. Frontend & UI: `/vercel/next.js`, `/shadcn-ui/ui`, `/tailwindlabs/tailwindcss`, `/radix-ui/primitives`.
2. Backend & CQRS: `/nestjs/nest`, `class-validator`, `/taskforcesh/bullmq`, `ioredis`.
3. Database & Storage: `/prisma/web` (or `/prisma/prisma`), `/postgresql/postgresql`.
4. Desktop & Native: `/tauri-apps/tauri`, `rusqlite`.
5. Testing: `/microsoft/playwright`, `jest`.

## Gates & Anti-Patterns

- Never query on routine language features (`Array.prototype.map`, `Promise.all`).
- Never perform more than 3 query attempts per task; use the best available snippet.
- Never guess API parameter order or signatures from stale model memory.
