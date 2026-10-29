# Master Intelligence & Agent Dispatcher Guide

## 1. System Overview

Central intelligence orchestrator connecting 7 specialized autonomous engineering agents with modular skills. All agents execute through an 8-stage lifecycle and enforce domain rules from `.agents/rules/`.

## 2. Specialized Autonomous Agents

- Planner & Architecture Agent: `@agents_planner` / `@agents-planner`
  - Domain: Requirements discovery, domain boundary modeling, tracer-bullet vertical slicing, ADRs, contract-first design, web-grounded research via Perplexity Agent API, competitor API reverse-engineering via `api-anything` MCP, and deterministic task authoring (`FR-`, `BE-`, `FR-BE-`, `QA-`).
  - Specification: `.agents/agents/planner.md`
  - Rules: `core.md`, `agents.md`, `backend.md`, `database.md`, `frontend.md`, `security.md`, `docs_and_ops.md`

- Frontend Agent: `@agents_frontend` / `@agents-frontend`
  - Domain: UI, UX, React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui.
  - Specification: `.agents/agents/frontend.md`
  - Rules: `core.md`, `frontend.md`, `ui.md`, `i18n.md`

- Backend Agent: `@agents_backend` / `@agents-backend`
  - Domain: NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, `@smartfeed/shared` contracts.
  - Specification: `.agents/agents/backend.md`
  - Rules: `core.md`, `backend.md`, `database.md`, `security.md`

- Code Review Agent: `@agents_review` / `@agents-review`
  - Domain: 5-axis code review, architecture compliance, security audit, zero N+1, 100% i18n, adversarial stress testing, live contract drift audit via `api-anything` MCP.
  - Specification: `.agents/agents/review.md`
  - Rules: `core.md`, `backend.md`, `database.md`, `frontend.md`, `ui.md`, `security.md`, `testing.md`

- QA & Performance Agent: `@agents_qa` / `@agents-qa`
  - Domain: Automated testing framework `e2e/`, Server/Local integration tests, 100k+ SKU benchmarks, chaos testing, mock/real parity.
  - Specification: `.agents/agents/qa.md`
  - Rules: `core.md`, `testing.md`, `database.md`, `i18n.md`

- DevOps & Release Agent: `@agents_devops` / `@agents-devops`
  - Domain: Docker Compose, zero-downtime PostgreSQL migrations (Expand/Contract), Railway cloud deployment, SemVer releases.
  - Specification: `.agents/agents/devops.md`
  - Rules: `core.md`, `docs_and_ops.md`, `database.md`, `security.md`

- Security & Pentest Agent: `@agents_security` / `@agents-security`
  - Domain: AppSec, STRIDE, OWASP Top 10 pentest, PoC exploit validation, secret masking, TOCTOU SSRF defense, remediation plans.
  - Specification: `.agents/agents/security.md`
  - Rules: `core.md`, `security.md`, `backend.md`, `testing.md`

## 3. Modular Skills Directory (`.agents/skills/`)

### Master Lifecycle Orchestrators

- `frontend`: Full-cycle frontend engineering lifecycle orchestrator.
- `backend`: Full-cycle backend CQRS engineering lifecycle orchestrator.
- `review`: 8-stage code review and quality assurance auditor.
- `git-commit`: Conventional commits and SemVer release tagging.
- `skill-creator`: Meta-skill for authoring, auditing, and optimizing skills.

### Frontend and UI/UX

- `ui-ux-pro-max`: Semantic design tokens, 100% solid sticky headers, zero duplicate CTAs, shadcn CLI.
- `vercel-react-best-practices`: React 18 performance, request deduplication via useRef, lean callbacks.
- `i18n-localization`: 100% bilingual parity (UK/EN), translated attributes, backend error mapping.
- `emil-design-eng`: Motion engineering, spring dynamics, transition durations, reduced-motion.
- `image`: WebP asset optimization, Sharp pipeline, placeholder handling.

### Backend, Database, and Queues

- `nestjs-best-practices`: NestJS 11 CQRS standards, 1 handler per file, DTO validation.
- `contract-first-api`: Single source of truth for Zod schemas and TypeScript DTOs in `@smartfeed/shared`.
- `prisma-postgres-mastery`: 100% FK indexes, timestamptz(6), snake_case mapping, CUIDs, cascade deletes.
- `postgresql-optimization`: Query plans, EXPLAIN ANALYZE, GIN pg_trgm text search, cursor pagination.
- `streaming-large-feeds`: SAX XML/CSV streaming for 100k+ SKU catalogs with memory backpressure.
- `bullmq-jobs`: BullMQ queues, worker idempotency (jobId), exponential retries, DLQ.
- `idempotency-and-outbox`: Redis idempotency keys and Prisma transactional outbox for webhooks.
- `subscription-lifecycle`: Quota calculations, grace periods, downgrade fallbacks, upgrade payment gating.
- `rust-native-backend`: Tauri v2 Rust SQLCipher SQLite backend, atomic transactions, cascade deletes.

### Code Quality, Testing, and Debugging

- `code-review-and-quality`: 5-axis code quality audit and pre-commit self-review checklist.
- `code-simplification`: Reducing cyclomatic complexity without changing behavior.
- `systematic-debugging`: 4-phase systematic debugging from reproduction to structural fix.
- `doubt-driven-development`: Adversarial stress-testing, TOCTOU race conditions, boundary fuzzing.
- `browser-debugging`: Playwright MCP live DOM, console, network waterfall, and screenshot inspection.
- `mock-real-parity`: 100% behavioral parity between browser mock, SQLite, and NestJS API.
- `playwright-automation`: Page Object Model, real business data assertions, bilingual UI tests.
- `test-driven-development`: Strict RED -> GREEN cycle with mandatory cleanDatabase teardown.
- `automated-guardrails-ci`: ESLint, Prettier, strict TypeScript typechecking, zero relative imports.
- `performance-optimization`: Performance benchmarking, p95 latency tracking, CPU/RAM profiling.

### Application Security and Pentest

- `security-and-hardening`: 4-layer defense, OWASP Top 10 hardening, safe OS execution (execFile).
- `secret-serialization`: Blocking password, token, and credential exposure in logs, Sentry, and responses.
- `api-security-testing`: OWASP API Security Top 10 (BOLA/IDOR, Mass Assignment, auth bypass).
- `web-app-penetration-testing`: Black-box security testing of web portal and desktop client.
- `penetration-testing-with-strix`: Autonomous end-to-end security penetration testing.
- `fix-security-vulnerabilities-with-strix`: Deterministic vulnerability remediation and patch verification.
- `tauri-v2-security-and-ipc`: Desktop binary security, OS Keychain, SQLite SQLCipher, IPC validation.

### Infrastructure, Planning, and Tooling

- `turborepo`: Monorepo build pipeline caching, package tasks over root tasks, filter optimization.
- `ci-cd-and-automation`: GitHub Actions workflows, CI release pipelines, Docker health.
- `release-and-rollback`: SemVer release governance, smoke checks, and rollback runbooks.
- `observability-and-instrumentation`: Structured logging, Sentry monitoring, incident tracing.
- `planning-and-lifecycle`: Deterministic task lifecycle in `plans/active/`, `plans/backlog/`, `plans/completed/` (`FR-`, `BE-`, `FR-BE-`).
- `writing-plans`: Bite-sized, testable TDD implementation steps (2-5 min) with explicit file boundaries and interfaces.
- `to-tickets`: Tracer-bullet vertical slicing through all architectural layers, declaring explicit blocking edges.
- `brainstorming`: Deep user-need discovery, non-obvious goal mapping, and pre-implementation solution probing.
- `interview-me`: Focused requirements elicitation, 1 question at a time.
- `spec-driven-development`: Specification of requirements and contracts before coding.
- `incremental-implementation`: Thin vertical slices (<250 lines) with iterative verification.
- `documentation-and-adrs`: Architecture Decision Records and continuous WIKI synchronization.
- `project-context-map`: Live system topology, ports, and inter-service connection map.
- `lessons-learned-registry`: Historical defect registry (L-xxx) and project invariant index.
- `source-driven-development`: Authoritative documentation fetching before implementation.
- `task-memory-and-state`: Task context persistence, execution state checkpointing, session handoff, and prompt token optimization in `.agents/state/active_task.json`.
- `handoff`: Conversation and session compaction for inter-agent context transfer.
- `context-engineering`: Token economy and prompt context hygiene.
- `ai-sdk`: Vercel AI SDK streaming integration and LLM catalog enrichment.
- `firecrawl-parse`: External catalog and documentation scraping into markdown.
- `api-anything`: Reverse-engineering website frontend traffic into typed JSON APIs, competitor catalog endpoint discovery, and self-healing extraction via api-anything MCP.
- `perplexity-agent-api`: Web-grounded live search, marketplace research, and multi-provider reasoning via Perplexity Agent API (POST /v1/agent).
- `omniroute-delegation`: Dispatches tasks, batch catalog processing, prompt testing, or reasoning workloads to the local OmniRoute AI Gateway on port 20128.
- `headroom-compression`: Compresses large datasets, plans, specs, feeds, logs, and multi-file diffs via Headroom (port 8787 / MCP) and auto-saves compressed files on disk (`<file>.compressed.<ext>`).
- `mcp-knowledge-cache`: Cache-first MCP knowledge retrieval, storage, Headroom compression, and OmniRoute-delegated cache refreshing in `.agents/cache/mcp/` (`pnpm ai:cache`).

## 4. Full-Stack Orchestra Protocol (`AGENT-04`)

To eliminate "raw / half-baked tasks" and disconnected development silos between Planner, Backend, and Frontend:

1. **Vertical Tracer Slices Only**: All feature tasks must cut end-to-end through DB -> API -> Shared -> UI. Developing backend endpoints without client consumer views or developing frontend views without backend contract alignment is prohibited.
2. **Specialized QA Ownership**: Backend and Frontend agents never author automated tests (`BE-08`, `TEST-00`). All test suites live in `e2e/` and are authored exclusively by `@agents_qa` under dedicated `QA-<num>` tasks.
3. **Mandatory Production Compilation**: Backend agents MUST run `pnpm --filter @smartfeed/backend-api build` upon code changes to guarantee the runtime bundle in `dist/` is fresh.
4. **Official shadcn Exclusivity**: Frontend agents MUST compose views strictly with official shadcn components (`@/components/ui/*`, `UI-05`), semantic tokens (`UI-02`), and neutral muted icons (`UI-07`). No hand-rolled ad-hoc HTML elements or rainbow icons.
5. **4-Point Definition of Done (DoD)**:
   - Criteria 1: Backend `dist/` is compiled and verified fresh (`pnpm --filter @smartfeed/backend-api build`).
   - Criteria 2: Static typecheck (`tsc --noEmit`) passes with 0 errors across all monorepo packages.
   - Criteria 3: Bilingual parity check (`pnpm i18n:check`) passes 100%.
   - Criteria 4: Automated domain invariants check (`pnpm invariants:check`) passes with 0 violations across UI semantic tokens, solid headers, CQRS single-handler structure, and controller DTOs.
   - (Note: End-to-end integration and Playwright test criteria apply strictly to QA tasks in `e2e/`).

## 5. Universal Invariant Protocol

Every skill and agent must load its governing rules from `.agents/rules/` before writing or editing code. Step 0 rule loading is mandatory.
