---
name: source-driven-development
description: Documentation verification protocol using context7 MCP. Enforces checking official framework documentation before writing library-specific code to prevent deprecated patterns or version drift.
rules:
  - core
---

# Source-Driven Development

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`.
2. Inspect `package.json` or `Cargo.toml` to identify exact dependency versions.
3. Call context7: `resolve-library-id {libraryName, query}` then `query-docs {libraryId, query}`.
4. Do not write library-specific code from unverified training memory.

## Upfront research protocol

1. Exact version detection: Identify dependency versions from project lockfiles (`package.json`, `Cargo.toml`) before designing features.
2. Context7 documentation lookup:
   - Frontend and UI: Query `/shadcn-ui/ui`, `/vercel/next.js`, `/tailwindlabs/tailwindcss`, `/radix-ui/primitives`, `/lucide-icons/lucide`.
   - Backend and CQRS: Query `/nestjs/nest`, `class-validator`, `/taskforcesh/bullmq`, Redis.
   - Database and ORM: Query `/prisma/prisma`, `/postgresql/postgresql`.
   - Desktop and Native: Query `/tauri-apps/tauri`, `rusqlite`.
   - Testing: Query `/microsoft/playwright`, Jest.
3. Authoritative sources only: Base implementations strictly on official documentation, official migration guides, and current specifications. Never rely on unofficial blog posts or unverified memory.
4. Prompt hygiene: Extract relevant API signatures and parameter constraints into working notes before beginning code synthesis.
