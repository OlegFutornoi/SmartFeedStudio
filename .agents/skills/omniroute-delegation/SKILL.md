---
name: omniroute-delegation
description: Dispatches tasks, batch catalog processing, prompt testing, translation, or reasoning workloads directly to zero-cost multi-provider AI fallback (Google AI Studio, Groq Cloud, OpenRouter). Use when the user requests tasks via OmniRoute, asks to use DeepSeek or alternative upstream models, or when running high-volume LLM workloads (spec translation, cache synthesis, catalog enrichment) that should not consume IDE tokens. Do not use for standard IDE pair programming, code refactoring, or database queries; use backend or frontend instead.
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
- Target model slug (defaults to zero-cost multi-provider fallback chain: `gemini-3.8-flash` -> `groq/openai/gpt-oss-120b` -> `groq/qwen/qwen3.8-27b` -> `gemini-flash-latest` -> `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` -> `openrouter/nvidia/nemotron-3.5-lightning:free` -> `openrouter/openrouter/free`).
- Optional system instructions or JSON schema requirements.
- Translation, plan compilation, or MCP cache refresh requests.

## Procedure

1. Stage 1 - Multi-Provider Environment Verification:
   Verify that `.env` contains valid keys for at least one zero-cost provider (`GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENROUTER_API_KEY`).
2. Stage 2 - Model Selection and Resilient Multi-Provider Free Fallback:
   By default, `omniroute-query.mjs` executes across a resilient multi-provider zero-cost fallback chain ($0.00 / 100% free):
   - Tier 1: Google AI Studio direct (`gemini-3.8-flash`, 15 RPM, 1M context, flagship reasoning).
   - Tier 2: Groq direct (`groq/openai/gpt-oss-120b`, 120B model, ~150ms instant response).
   - Tier 3: Groq direct (`groq/qwen/qwen3.8-27b`, 27B model, ~20ms ultra-fast response).
   - Tier 4: Google AI Studio backup (`gemini-flash-latest`).
   - Tier 5: OpenRouter flagship free (`openrouter/nvidia/nemotron-3-ultra-550b-a55b:free`, 550B MoE).
   - Tier 6: OpenRouter lightning free (`openrouter/nvidia/nemotron-3.5-lightning:free`, 128k context).
   - Tier 7: OpenRouter dynamic free pool (`openrouter/openrouter/free`, 200k context auto-balancer).
     If any model or provider encounters HTTP 429 rate limits or cooldowns, OmniRoute automatically falls back to the next tier without human intervention.
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

- Task executed via AI provider `POST /chat/completions` and returned HTTP 200.
- Output parsed cleanly without error and meets schema constraints.
- No secrets exposed in logs or console output.

## Never

- Never send requests to paid LLM tiers when zero-cost models are available.
- Never hardcode API keys into code or committed files.
- Never use emojis in CLI logs, output reports, or error messages (`CORE-13`).
- Never ask confirmation questions before invoking query CLI (`CORE-08`).

## References

- `scripts/omniroute-query.mjs` - Multi-provider CLI runner.
- `services/backend-api/src/modules/ai/llm-gateway.service.ts` - NestJS gateway integration service.
