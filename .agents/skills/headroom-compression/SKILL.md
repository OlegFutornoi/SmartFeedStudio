---
name: headroom-compression
description: Optimizes context tokens by translating and compressing plans, specs, and feeds through local Python Headroom engine and direct multi-provider AI fallback before passing them to the active model. Automatically delegates non-complex translation/distillation of Ukrainian specs to zero-cost AI models, saving 65-75% tokens via dense English BPE compression.
rules: [core, agents]
---

# Headroom Context Compression Skill

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/agents.md`.
2. Verify invariant `CORE-04`: keep skill body under 250 lines.
3. Verify invariant `CORE-08`: zero confirmation questions for autonomous execution.
4. Verify invariant `CORE-13`: absolute ban on emojis across output, scripts, and logs.
5. Verify invariant `CORE-14`: two-tier plan architecture (Ukrainian human plan + dense English machine plan) and single-file cache entries.

## Inputs

- Raw data collected by an agent (plans, specs, architecture docs, feed chunks, JSON payloads, git diffs, build/test logs).
- User direct request to compress a file or plan: "потрібно зжати <файл>", "стисни <файл>", "зжати план".
- Optional target output file path (`-o <output-path>` or default `<file>.compressed.<ext>`).

## Procedure

1. Stage 1 - Pre-Compression Hygiene & Format Check:
   - Ensure input starts with `# Heading` on line 1 (`MD041`) and contains zero Markdown tables (`| col | col |`). Convert any tables into compact bullet lists (`- **ID** | Field: value`).
2. Stage 2 - AI Translation & Semantic Distillation:
   - For Ukrainian/Cyrillic plans or specifications, `scripts/headroom-compress.mjs` automatically delegates translation and semantic compilation to zero-cost multi-provider AI fallback (Google AI Studio, Groq Cloud, OpenRouter) at ZERO IDE token cost.
   - Translating to dense technical English cuts token consumption by 65-75% because BPE tokenizers encode English at ~4 characters/token versus Cyrillic at ~2.7 characters/token, while distilling prose removes narrative fluff.
   - All 100% of defect IDs (`DEF-xx`), file paths, line numbers, CWEs, rule invariants, code signatures, and 4-point DoD are strictly preserved.
3. Stage 3 - Local Headroom Optimization:
   - Run local Headroom Python pipeline (`headroom.compress`) on the compiled English text to collapse redundant whitespace, unwrap JSON artifacts, and format headings (`MD022`).
   - Auto-save execution plan: `node scripts/headroom-compress.mjs <file-path> --save`
   - Formats output via Prettier (`npx prettier --write <output-file>`).
4. Stage 4 - Delivery to Model / User:
   - For plans: Keep `<name>.md` (Ukrainian for user review) AND `<name>.compressed.md` (dense English for agent execution).
   - Update references in `plans/README.md` and `.agents/state/active_task.json`.
   - Output a concise 1-2 sentence status summary with clickable link to the compressed plan and token reduction statistics.

## Outputs

- Machine-optimized execution file: `<filename>.compressed.md` in dense technical English (65-75% token reduction).
- Human specification: `<filename>.md` in Ukrainian for user review (`PLAN-02`).
- Token savings statistics (`original_tokens` -> `compressed_tokens`, `savings_percent`).

## Gate (stop condition)

- Compressed file generated, formatted with Prettier, and verified on disk.
- All defect IDs, paths, line numbers, and DoD steps 100% preserved.
- Token reduction of >= 60% achieved when compiling Ukrainian specs to English.
- Zero emojis in output and logs (`CORE-13`).

## Never

- Never produce an identical Ukrainian copy in `<file>.compressed.md` with 0% token savings — always compile to dense technical English via OmniRoute.
- Never omit numbered defect IDs, file paths, or DoD commands during distillation.
- Never feed raw Markdown tables (`| col | col |`) into compression without converting to bullet lists.
- Never use emojis in CLI logs, output reports, or error messages (`CORE-13`).

## References

- `scripts/headroom-compress.mjs` - CLI runner combining multi-provider English compilation and local Headroom formatting.
