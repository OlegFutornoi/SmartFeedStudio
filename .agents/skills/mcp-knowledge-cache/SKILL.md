---
name: mcp-knowledge-cache
description: Cache-first MCP knowledge retrieval, single-file Headroom compression (.compressed.md), and OmniRoute-delegated cache refreshing in .agents/cache/mcp/. Use before and after calling external documentation or research MCP tools (context7, perplexity-agent-api, firecrawl, api-anything, shadcn) so agents reuse verified knowledge without redundant external requests and overwrite stale entries via OmniRoute. Do not use for application runtime Redis caching; use backend instead.
rules: [core, agents]
---

# MCP Knowledge Cache Skill

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/agents.md`.
2. Enforce invariant `CORE-06`: always check local MCP cache (`.agents/cache/mcp/`) before invoking external MCP documentation or search tools.
3. Enforce invariant `CORE-14`: store strictly ONE single compressed file per entry (`.compressed.md`) with zero duplicate `.md` files, starting with `# Heading` on line 1 (`MD041`), zero markdown tables, and zero outer ` ```markdown ` wrappers.
4. Enforce invariant `CORE-04`: keep skill body under 100 lines.
5. Enforce invariant `CORE-08`: zero confirmation questions for autonomous execution.
6. Enforce invariant `CORE-13`: absolute ban on emojis across output, scripts, and logs.

## Inputs

- Target cache key in `<source>:<topic-slug>` format (e.g., `context7:nestjs-11-security`, `context7:prisma-7-postgres`, `perplexity:owasp-api-top10`, `api-anything:rozetka-endpoints`).
- Raw documentation, API schemas, or search results fetched from MCP servers (`context7`, `perplexity`, `firecrawl`, `api-anything`, `shadcn`).
- Optional refresh instructions when updating an existing cache entry via OmniRoute.

## Procedure

1. Stage 1 - Cache-First Lookup (Before Calling MCP):
   Check if the topic is already cached locally before making external MCP calls:
   - List or search cache: `pnpm ai:cache list` or `pnpm ai:cache search "<keyword>"`
   - Fetch cached entry: `pnpm ai:cache get "<source>:<topic-slug>"`
   - If `HIT` and content answers the requirement, use the cached compressed knowledge immediately and skip external MCP calls.
2. Stage 2 - Live MCP Fetch (On Cache Miss or Explicit Update):
   If `MISS` or the user requests fresh data, invoke the appropriate MCP tool (`context7`, `perplexity`, `firecrawl`, `api-anything`, `shadcn`).
3. Stage 3 - Store Single Compressed Entry in Cache:
   Persist newly fetched MCP information into `.agents/cache/mcp/entries/<slug>.compressed.md` using a single-quoted heredoc (`cat << 'EOF'`) so bash/zsh never expands `$variables` like `$transaction()`:
   - Store with compression: `cat << 'EOF' | pnpm ai:cache set "<key>" --source "<mcp>" --query "<query>" --summary "<1-line summary>"`
   - Store with OmniRoute structuring + Headroom compression: append `--omni` flag.
4. Stage 4 - Delegate Cache Refresh & Overwrite:
   When updating an existing cache key with newly fetched MCP data, delegate merging and distillation to zero-cost AI fallback so it overwrites the single `.compressed.md` entry cleanly without consuming IDE tokens:
   - Execute: `cat << 'EOF' | pnpm ai:cache refresh "<key>" --prompt "<merge instructions>"`

## Outputs

- Single Headroom-compressed markdown file in `.agents/cache/mcp/entries/<slug>.compressed.md` (zero duplicate `.md` files).
- Updated metadata registry in `.agents/cache/mcp/index.json`.

## Gate (stop condition)

- Cache lookup (`pnpm ai:cache get` or `search`) executed prior to external MCP documentation queries.
- Single `.compressed.md` file verified on disk starting with `# Heading` on line 1, with zero duplicate `.md` files.
- Zero markdown tables, zero outer code fences, and zero emojis (`CORE-13`, `CORE-14`).

## Never

- Never create both `<slug>.md` and `<slug>.compressed.md` in `.agents/cache/mcp/entries/` — store strictly the single `.compressed.md` file (`CORE-14`).
- Never pass text containing `$` symbols (such as `$transaction`) inside double-quoted `--text "..."` CLI arguments; always pipe via `cat << 'EOF'`.
- Never put HTML comments on line 1 before the `# Heading` or use Markdown tables (`| col | col |`) inside cache entries (`CORE-14`).
- Never query `context7`, `perplexity`, or `firecrawl` repeatedly for the same topic without checking `pnpm ai:cache` first (`CORE-06`).

## References

- `scripts/mcp-cache.mjs` - CLI manager for MCP cache lookup, single-file Headroom compression, and OmniRoute refresh.
- `.agents/cache/mcp/index.json` - Central registry of cached MCP knowledge entries.
