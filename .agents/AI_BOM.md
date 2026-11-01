# AI-BOM: Software & Model Bill of Materials

Inventory of AI agents, skills, hooks, and MCP servers in SmartFeed Studio.

## 1. Governance & Security Policy

- Principle of Least Privilege: MCP servers with write capabilities are restricted to sandboxed local or staged operations.
- Secret Hygiene: Zero hardcoded API keys in tracked repository files. All secrets are stored in macOS Keychain or gitignored `.env`.
- Audit Protocol: MCP tool executions are verified deterministically by PreToolUse and Stop guardrails.

## 2. Model & API Fallback Chain

- Primary LLM: Anthropic Claude 3.5 Sonnet / Google Gemini 2.5 Flash via Antigravity SDK.
- Zero-Cost Fallback: Google AI Studio (Gemini 2.5 Flash), Groq Cloud (Qwen 2.5 72B / Llama 3.3 70B), OpenRouter Free Tier via `omniroute-query.mjs`.
- Specialized Research: Context7 MCP for documentation; Perplexity Search for marketplace schemas.

## 3. Connected MCP Servers Inventory

- `api-anything`
  - Transport: stdio (`/usr/local/bin/node /Users/oleg/.local/api-anything/dist/cli.js mcp --allow-writes`)
  - Permissions: Read/Write (local reverse-engineered API catalog)
  - Purpose: Competitor marketplace endpoint analysis and live contract extraction.
  - Owner: System Architecture (`@agents_planner`, `@agents_review`).

- `context7`
  - Transport: stdio (`npx -y @upstash/context7-mcp`)
  - Permissions: Read-only
  - Secret Source: macOS Keychain (`CONTEXT7_API_KEY`)
  - Purpose: Live authoritative documentation fetching for frameworks and libraries.
  - Owner: Full Stack (`@agents_planner`, `@agents_backend`, `@agents_frontend`).

- `firecrawl`
  - Transport: stdio (`npx -y firecrawl-mcp`)
  - Permissions: Read-only (scraping & parsing)
  - Secret Source: macOS Keychain (`FIRECRAWL_API_KEY`)
  - Purpose: External catalog, supplier documentation, and web parsing.
  - Owner: Research & Catalog Engineering.

- `github`
  - Transport: stdio (`/opt/homebrew/bin/github-mcp-server stdio --read-only`)
  - Permissions: Read-only
  - Secret Source: GitHub CLI (`gh auth token`)
  - Purpose: Commit history, issue tracking, and repository introspection.
  - Owner: DevOps & Review (`@agents_devops`, `@agents_review`).

- `playwright`
  - Transport: stdio (`npx -y @playwright/mcp@latest`)
  - Permissions: Interactive browser automation (DOM, screenshots, console, network)
  - Purpose: Live UI testing, visual regression debugging, browser automation.
  - Owner: Frontend & QA (`@agents_frontend`, `@agents_qa`).

- `postgres`
  - Transport: stdio (`/Users/oleg/.local/bin/postgres-mcp --access-mode=restricted`)
  - Permissions: Restricted SQL execution (local dev `smartfeed_db`)
  - Secret Source: Local environment variable `DATABASE_URL`
  - Purpose: Query performance inspection, schema verification, EXPLAIN ANALYZE.
  - Owner: Backend & Database (`@agents_backend`).

- `railway`
  - Transport: stdio (`/Users/oleg/.railway/bin/railway mcp`)
  - Permissions: Read/Write (cloud infrastructure management)
  - Secret Source: macOS Keychain (`RAILWAY_TOKEN`)
  - Purpose: Cloud staging environments, variables, metrics, deployments.
  - Owner: DevOps (`@agents_devops`).

- `redis`
  - Transport: stdio (`uvx --with 'mcp<2' --from redis-mcp-server redis-mcp-server --url redis://127.0.0.1:6379`)
  - Permissions: Read/Write (local cache and BullMQ queue inspections)
  - Secret Source: Local URL (zero external exposure)
  - Purpose: Idempotency tokens, BullMQ job queues, cache eviction testing.
  - Owner: Backend (`@agents_backend`).

- `sentry`
  - Transport: stdio (`mcp-server-sentry`)
  - Permissions: Read-only
  - Secret Source: Environment variable `SENTRY_AUTH_TOKEN`
  - Purpose: Crash report analysis, error telemetry, issue reproduction.
  - Owner: Observability & DevOps (`@agents_devops`, `@agents_qa`).

- `shadcn`
  - Transport: stdio (`npx -y shadcn@latest mcp`)
  - Permissions: Read-only component schema exploration
  - Purpose: Component installation and design system verification.
  - Owner: Frontend (`@agents_frontend`).

- `headroom`
  - Transport: stdio (`/Users/oleg/.local/bin/headroom mcp serve`)
  - Permissions: Read-only compression engine
  - Purpose: Context token compression (CCR) for feeds, plans, and diffs.
  - Owner: System Core (`headroom-compression`).

- `perplexity`
  - Transport: stdio (`npx -yq @perplexity-ai/mcp-server`)
  - Permissions: Read-only live search and reasoning
  - Secret Source: Environment variable `PERPLEXITY_API_KEY`
  - Purpose: Marketplace feed specs and technical grounding.
  - Owner: System Architecture (`@agents_planner`).
