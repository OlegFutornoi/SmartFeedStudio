---
name: omniroute-delegation
description: Dispatches tasks, batch catalog processing, prompt testing, translation, or reasoning workloads to the local OmniRoute AI Gateway on port 20128. Use when the user requests tasks via OmniRoute, asks to use DeepSeek or alternative upstream models, or when running high-volume LLM workloads (spec translation, cache synthesis, catalog enrichment) that should not consume IDE tokens. Do not use for standard IDE pair programming, code refactoring, or database queries; use backend or frontend instead.
rules: [core, backend]
---

# OmniRoute Delegation Skill

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/backend.md`.
2. Verify invariant `CORE-04`: keep skill body under 250 lines.
3. Verify invariant `CORE-08`: zero confirmation questions for autonomous execution.
4. Verify invariant `CORE-13`: absolute ban on emojis across output, scripts, and logs.
5. Verify invariant `SEC-01`: do not hardcode API keys or secrets; load from `.env` or environment.

## Inputs

- Task specification or prompt payload requested by the user or invoked by system scripts.
- Target model slug (defaults to `openrouter/deepseek/deepseek-chat` or `auto/best-free`).
- Optional system instructions or JSON schema requirements.
- Translation, plan compilation, or MCP cache refresh requests.

## Procedure

1. Stage 1 - Container and Health Verification:
   Verify that OmniRoute container `smartfeed-omniroute` is healthy on port 20128 using `curl -s http://localhost:20128/v1/models` with `OMNIROUTE_API_KEY`.
2. Stage 2 - Model Selection and Payload Formation:
   Select appropriate model based on task requirements:
   - For plan translation & semantic compression: `openrouter/deepseek/deepseek-chat`.
   - For fast free-tier deterministic classification: `auto/best-free`.
   - For general OpenAI compatibility: `auto`.
3. Stage 3 - Script Execution:
   Execute prompt through `scripts/omniroute-query.mjs` or npm script `pnpm ai:omni`:
   - Single prompt: `pnpm ai:omni --prompt "<prompt>"`
   - Prompt with system instruction: `pnpm ai:omni --system "<system>" --prompt "<prompt>"`
   - Custom model override: `pnpm ai:omni --model "auto/best-free" --prompt "<prompt>"`
   - Structured JSON output: `pnpm ai:omni --json --prompt "<prompt>"`
   - Plan translation & distillation (used automatically by `scripts/headroom-compress.mjs`): compiles Ukrainian plans into dense English execution plans, slashing tokens by 65-75% at zero IDE token cost.
   - MCP Knowledge Cache Refresh / Synthesis: `pnpm ai:cache refresh "<key>" --text "<new-mcp-data>" --prompt "<merge instructions>"` (delegates structuring to OmniRoute, compresses via Headroom, and overwrites `.agents/cache/mcp/`).
4. Stage 4 - Output Validation:
   Verify response is non-empty, contains valid JSON if requested, and meets user task goals.
5. Stage 5 - Result Delivery:
   Present result to the user with latency and model used, strictly without emojis.

## Outputs

- Execution results returned from the specified OmniRoute model.
- Compiled English execution plans in `plans/active/*.compressed.md`.
- Cached documentation entries in `.agents/cache/mcp/entries/*.compressed.md`.

## Gate (stop condition)

- Task executed via OmniRoute `POST /v1/chat/completions` and returned HTTP 200.
- Output parsed cleanly without error and meets schema constraints.
- No secrets exposed in logs or console output.

## Never

- Never send requests directly to external paid LLM endpoints bypassing OmniRoute when this skill is invoked.
- Never hardcode `OMNIROUTE_API_KEY` into code or committed files.
- Never use emojis in CLI logs, output reports, or error messages (`CORE-13`).
- Never ask confirmation questions before invoking OmniRoute query CLI (`CORE-08`).

## References

- `scripts/omniroute-query.mjs` - CLI runner for OmniRoute queries.
- `docker-compose.yml` - OmniRoute container service definition.
- `services/backend-api/src/modules/ai/llm-gateway.service.ts` - NestJS gateway integration service.
