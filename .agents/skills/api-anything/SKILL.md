---
name: api-anything
description: Reverse-engineers website frontend traffic into typed JSON APIs and executes fast direct HTTP calls with automatic self-healing via api-anything MCP. Use when Planner or Review agents need to inspect competitor catalog endpoints (Rozetka, Prom.ua, Epicentr), verify live payload structures against @smartfeed/shared contracts, test pricing extraction, or perform catalog enrichment without heavy DOM scraping.
rules:
  - core
  - backend
  - security
---

# api-anything Reverse-Engineering & Competitor MCP Integration

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, and `.agents/rules/security.md`.
2. Enforce invariant `CORE-08`: 100% MCP auto-approval for `api-anything` tool execution without confirmation prompts.
3. Enforce invariant `SEC-01`: never log or expose raw session cookies or authentication tokens.
4. Enforce invariant `CORE-04`: keep parsing services and adapters under 250 lines.

## Tools Overview

The `api-anything` MCP server provides the following tools:

- `find_sites`: searches local and community-shared specifications by domain or keywords (e.g. query: "rozetka" or query: "prom.ua").
- `list_sites`: returns all installed sites available locally.
- `list_operations`: returns a site's discovered operations, arguments JSON Schema (`inputSchema`), return fields, and caveats.
- `call_operation`: executes a read operation over direct HTTP (falling back to headless browser if self-healing is triggered).
- `call_write_operation`: executes a write mutation (requires `--allow-writes`).
- `learn_site`: teaches a new operation from a URL and sample parameters by observing browser network traffic.
- `login`: refreshes or imports browser session cookies when targets require authentication or challenge clearance.

## Usage Procedure for Planner Agent (@agents_planner)

1. Discover existing site specs: invoke `find_sites` with domain (e.g. `rozetka.com.ua` or `prom.ua`).
2. If the site is already learned, run `list_operations` to view available endpoints (e.g. search, product details, category lists) and parameter schemas.
3. If new site discovery is needed, invoke `learn_site` with target URL template and sample search query args.
4. Verify payload contracts: execute sample read via `call_operation` to obtain live JSON response structure.
5. Model shared contract: use the verified payload fields to author Zod schemas and TypeScript DTOs in `@smartfeed/shared` for competitor monitoring or feed enrichment.

## Usage Procedure for Review Agent (@agents_review)

1. External contract audit: when reviewing competitor scraper or sync code, call `list_operations` and `call_operation` for the target marketplace.
2. Drift detection: check if live marketplace payload keys match the internal `@smartfeed/shared` DTO properties.
3. Rate limit and error handling audit: verify that backend callers properly handle `class: "rate_limit"`, `class: "auth_wall"`, or `class: "drift"`.
4. Mock-real parity: verify that unit/integration test mocks reflect the real data structure returned by `call_operation`.

## Outputs

- Discovered site operations and parameter schemas.
- Structured JSON payloads from competitor search and catalog endpoints.
- Self-healing status and drift detection reports.
- Grounded contract schemas for `@smartfeed/shared`.

## Gate (stop condition)

- MCP server `api-anything` responds to `list_operations` or `find_sites`.
- Live payload data is returned without raw credential leakage.
- Contract DTOs in `@smartfeed/shared` are aligned with live marketplace response fields.
