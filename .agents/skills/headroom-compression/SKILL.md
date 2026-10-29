---
name: headroom-compression
description: Optimizes context tokens by compressing large datasets, plans, specs, feeds, logs, and multi-file diffs through Headroom (port 8787 / MCP) before passing them to the active model. Automatically compresses files and saves `<filename>.compressed.<ext>` on disk when the user requests "потрібно зжати", "стисни файл", or context compression.
rules: [core, agents]
---

# Headroom Context Compression Skill

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/agents.md`.
2. Verify invariant `CORE-04`: keep skill body under 250 lines.
3. Verify invariant `CORE-08`: zero confirmation questions for autonomous execution.
4. Verify invariant `CORE-13`: absolute ban on emojis across output, scripts, and logs.
5. Verify invariant `CORE-14`: compress large context before model reasoning.

## Inputs

- Raw data collected by an agent (plans, specs, architecture docs, feed chunks, JSON payloads, git diffs, build/test logs).
- User direct request to compress a file or plan: "потрібно зжати <файл>", "стисни <файл>", "зжати план".
- Optional target output file path (`-o <output-path>` or default `<file>.compressed.<ext>`).
- Active model currently operating in the chat (Gemini 3.8 Flash, Claude Sonnet 5.5, Claude Opus 5.5, Gemini 4 Argon, etc.).

## Procedure

1. Stage 1 - Trigger & Target Identification:
   - If user commands "потрібно зжати <файл>" or requests file compression, identify target file path.
   - If an agent gathers large context (>500 tokens) during research or handoff, select content for optimization.
2. Stage 2 - Compression Execution & File Generation:
   Execute compression via `scripts/headroom-compress.mjs`:
   - Auto-save compressed file to disk: `node scripts/headroom-compress.mjs <file-path> --save`
   - Explicit output destination: `node scripts/headroom-compress.mjs <file-path> -o <output-path>`
   - Direct text compression: `node scripts/headroom-compress.mjs --text "<data>"`
   - Stdin stream piping: `cat <file> | pnpm ai:compress --save`
   - MCP tool execution: call `headroom_compress` tool with `{"content": "<data>"}`.
3. Stage 3 - Token Savings & Integrity Verification:
   Inspect compression result:
   - Check `original_tokens`, `compressed_tokens`, and `savings_percent`.
   - Confirm that schema, code signatures, task steps, and file paths are 100% intact.
   - For files saved to disk, verify that `<file>.compressed.<ext>` was successfully created and is non-empty.
4. Stage 4 - Delivery to Model / User:
   - When requested by user: present a concise 1-2 sentence summary with clickable link to the compressed file `[Стиснутий файл](file:///...)` and token savings percentage.
   - When used in agent handoff: provide the compressed file content or path to the executor agent (Backend, Frontend, QA) so it executes the plan with minimal token footprint.

## Outputs

- Compressed file on disk: `<filename>.compressed.<ext>`.
- Token savings statistics (`original_tokens` -> `compressed_tokens`, `savings_percent`).
- Full semantic fidelity preserved for model execution.

## Gate (stop condition)

- Compressed file generated and exists on disk.
- Content parsed cleanly without syntax errors.
- Token reduction achieved or lossless densification applied.
- Zero emojis in output and logs (`CORE-13`).

## Never

- Never dump uncompressed multi-megabyte feed dumps, raw logs, or verbose plans directly into context when compression is requested.
- Never alter functional code logic or drop necessary task constraints during compression.
- Never use emojis in CLI logs, output reports, or error messages (`CORE-13`).
- Never ask confirmation questions before compressing a file (`CORE-08`).

## References

- `scripts/headroom-compress.mjs` - CLI runner for Headroom compression with `--save` and `-o` support.
- `docker-compose.yml` - Headroom container service definition (`smartfeed-headroom`, port 8787).
- `.agents/mcp_config.json` - MCP configuration for Headroom server.
