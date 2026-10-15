---
name: ai-sdk
description: Vercel AI SDK integration for text generation, streaming, tool loops, structured JSON outputs, and embedding workflows in NestJS and React.
rules:
  - core
  - backend
---

# Vercel AI SDK Integration

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/backend.md`.
2. Inspect installed `ai` package version in `package.json` lockfiles.
3. Call context7: `resolve-library-id {libraryName: "ai", query: "..."}` and `query-docs`.
4. Do not synthesize AI SDK code from unverified model memory.

## Development instructions

1. Verify installed version: Check `node_modules/ai/package.json` for installed version. Never use deprecated v2/v3 function signatures if running v4+.
2. Provider configuration: Configure OpenRouter or OpenAI providers using environment variables (`OPENROUTER_API_KEY`). Fail fast if required API keys are missing; never hardcode fallback keys.
3. Text generation and streaming:
   - For backend batch catalog enrichment: Use `generateText` with structured output Zod schemas (`Output.object({ schema })`).
   - For interactive chat assistants: Use `streamText` and pipe stream responses to HTTP response headers.
4. Tool calling and agent loops: Use built-in `ToolLoopAgent` or typed tools with explicit parameter Zod schemas. Validate all model outputs prior to persistence.
5. Error handling and rate limits: Wrap AI provider calls in bounded retry handlers with exponential backoff. Catch provider 429 quota exhaustion errors and return structured domain exceptions.
