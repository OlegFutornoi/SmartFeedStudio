---
name: perplexity-agent-api
description: Web-grounded live search, marketplace research, and multi-provider reasoning via Perplexity Agent API (POST /v1/agent). Use when agents need real-time web facts, marketplace feed format specifications (Rozetka, Prom.ua, Horoshop), competitor pricing models, or supplier catalog documentation with search_results citations and structured JSON output. Do not use for local SQLite queries or internal code refactoring; use context7-mcp or prisma-postgres-mastery instead.
rules:
  - core
  - backend
  - security
---

# Perplexity Agent API Integration

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, and `.agents/rules/security.md`.
2. Enforce invariant `SEC-01`: resolve API credentials exclusively from the `PERPLEXITY_API_KEY` environment variable. Never hardcode, log, serialize, or commit secrets.
3. Enforce invariant `CORE-02`: handle API exceptions with structured error mappings; never swallow 401 or 429 responses.
4. Enforce invariant `CORE-04`: keep service files and wrappers under 200 lines.

## Inputs

- Research query or research topic.
- Preset selection: `preset: "low"` for fast cost-efficient queries or `preset: "medium"` for in-depth reasoning with web search.
- Optional tools array: `tools: [{"type": "web_search"}]` or `[{"type": "fetch_url"}]`.
- Optional `previous_response_id` for multi-turn conversations.
- Optional structured schema: `response_format` JSON schema for parseable output.

## Procedure

0. Check local MCP cache first: run `pnpm ai:cache get "perplexity:<topic-slug>"` or `pnpm ai:cache search "<keyword>"`. If a valid entry exists and no explicit refresh is requested, use the cached compressed output immediately.
1. Verify credential presence: execute `test -n "$PERPLEXITY_API_KEY"` before launching requests. If missing, instruct user to configure `PERPLEXITY_API_KEY` in the API console.
2. Initialize official SDK: instantiate `Perplexity` from `@perplexity-ai/perplexity_ai` with `{ apiKey }`.
3. Construct payload: specify `preset: "low"` (default) or custom `model` with `tools: [{"type": "web_search"}]`. Pass question string in `input`.
4. Process web-grounded answer: read aggregated text from `response.output_text`. Extract source citations and URLs from `response.output[*].results` and annotations.
5. Persist or overwrite in MCP cache: store the result via `pnpm ai:cache set "perplexity:<topic-slug>" --source "perplexity" --query "<query>" --text "<output>"` (or `pnpm ai:cache refresh` to synthesize via OmniRoute and compress via Headroom).
6. Multi-turn continuation: pass previous turn ID as `previous_response_id` instead of appending full conversational history.
7. Structured data extraction: supply `text: { format: { type: "json_schema", json_schema: { ... } } }` when schema-compliant JSON is required.
8. Error and rate limit management: inspect error status. Map 401 to `UnauthorizedException`. For 429 rate limits, extract `retry-after` header and honor backoff delay before retrying.

## Outputs

- Grounded answer text from `response.output_text`.
- Search source URLs, titles, and snippets from `response.output[*].results`.
- Structured JSON objects when `response_format` schema is specified.
- Response ID `response.id` for downstream multi-turn continuation.

## Gate (stop condition)

- Real request returns HTTP 200 with non-empty `output_text`.
- `PERPLEXITY_API_KEY` is resolved strictly from environment without leaking into logs.
- Search result citations contain valid source URLs.
- Zero markdown tables in documentation and skill definitions.

## Never

- Never hardcode, print, commit, or log `PERPLEXITY_API_KEY`.
- Never guess API parameters; consult published documentation at `https://docs.perplexity.ai/llms.txt`.
- Never scrape response bodies when `response.output_text` convenience property is available.
- Never use Router API endpoints when web search grounding is required.

## References

- `references/quickstart-and-examples.md` - read when configuring custom tools, structured JSON schemas, or multi-turn conversational state.
