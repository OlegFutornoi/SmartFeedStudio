# Master Intelligence & Agent Dispatcher Guide

## 1. System Overview

Central intelligence orchestrator connecting 7 specialized autonomous engineering agents with 43 modular skills. All agents execute through an 8-stage lifecycle and enforce domain rules from `.agents/rules/`.

## 2. Specialized Autonomous Agents

- Planner: `@agents_planner` (`.agents/agents/planner.md`) — Domain architecture, tracer slices, Zod contracts, Dual-Plan authoring.
- Frontend: `@agents_frontend` (`.agents/agents/frontend.md`) — React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, official shadcn primitives.
- Backend: `@agents_backend` (`.agents/agents/backend.md`) — NestJS 11 CQRS, Prisma ORM, PostgreSQL 16, Redis, BullMQ, `@smartfeed/shared` contracts.
- Review: `@agents_review` (`.agents/agents/review.md`) — Strictly read-only 5-axis code reviewer, architecture and security auditor.
- QA: `@agents_qa` (`.agents/agents/qa.md`) — Sole author of automated test suites in `e2e/` (`TEST-00`).
- DevOps: `@agents_devops` (`.agents/agents/devops.md`) — Docker Compose, Expand/Contract PostgreSQL migrations, Railway deployments, SemVer releases.
- Security: `@agents_security` (`.agents/agents/security.md`) — AppSec red/blue team, OWASP Top 10 pentest, SSRF defense, remediation plans.

## 3. Skills Index (43 Modular Skills)

- `ai-sdk`: Vercel AI SDK text generation, structured JSON output, streaming endpoints.
- `api-anything`: Reverse-engineers website network traffic into typed JSON APIs.
- `api-security-testing`: OWASP API Top 10 pentests (BOLA, IDOR, Mass Assignment).
- `backend`: Full-cycle backend CQRS engineering lifecycle orchestrator.
- `brainstorming`: Explores user needs, design trade-offs, and requirement elicitation.
- `browser-debugging`: Live interactive DOM, console errors, screenshot capture via Playwright MCP.
- `bullmq-jobs`: Redis 7 BullMQ queues, worker concurrency, retries, DLQ, and outbox.
- `ci-cd-and-automation`: GitHub Actions workflows, CI pipelines, and automated guardrails.
- `code-simplification`: Reduces cyclomatic complexity while preserving contracts and behavior.
- `contract-first-api`: Single source of truth for Zod schemas and DTOs in `@smartfeed/shared`.
- `documentation-and-adrs`: Architecture Decision Records (ADRs) and wiki documentation.
- `doubt-driven-development`: Adversarial stress-testing, concurrency race flaws, and TOCTOU probing.
- `find-skills`: Discovers and installs skills from open agent skills ecosystem.
- `firecrawl-parse`: Scrapes and converts external HTML/PDF documentation into markdown.
- `frontend`: Full-cycle frontend engineering lifecycle orchestrator.
- `git-commit`: Conventional commits, [skip ci] flags, and SemVer release tagging.
- `headroom-compression`: Translates and compresses Ukrainian plans/specs via Headroom and AI fallback.
- `i18n-localization`: 100% bilingual parity (UK/EN) and backend error translation mapping.
- `incremental-implementation`: Thin vertical slicing (<250 lines) with iterative verification.
- `lessons-learned-registry`: Historical defect registry (L-001+) and invariant index.
- `mcp-knowledge-cache`: Cache-first MCP retrieval, Headroom compression, and Context7 docs.
- `mock-real-parity`: 100% data and behavior parity between browser mock, SQLite, and PostgreSQL.
- `nestjs-best-practices`: NestJS 11 CQRS standards, 1 handler per file, DTO validation.
- `observability-and-instrumentation`: Structured JSON logging, correlation IDs, and Sentry tracing.
- `omniroute-delegation`: Dispatches heavy batch tasks to zero-cost multi-provider AI fallback.
- `performance-optimization`: Full-stack profiling, p95 latency reduction, and memory leak analysis.
- `perplexity-agent-api`: Web-grounded live search and marketplace feed research with citations.
- `planning-and-lifecycle`: Vertical tracer slice planning, ticket slicing, and plan lifecycle.
- `playwright-automation`: Page Object Model, real business invariant assertions, bilingual tests.
- `prisma-postgres-mastery`: Prisma ORM schema design, FK indexes, timestamptz(6), EXPLAIN ANALYZE.
- `project-context-map`: Monorepo system topology, service ports, and directory boundaries.
- `release-and-rollback`: Semantic versioning, changelog generation, and zero-loss rollback.
- `review`: 5-axis architecture, security, and invariant audit orchestrator.
- `rust-native-backend`: Tauri v2 Rust SQLCipher SQLite backend, IPC commands, and keychain.
- `secret-serialization`: Audits credential and token leaks through JSON serialization and logs.
- `security-and-hardening`: 4-layer defense, SSRF IP pinning, execFile, and vulnerability remediation.
- `skill-creator`: Meta-skill for authoring, auditing, and benchmarking modular skills.
- `systematic-debugging`: 4-phase systematic debugging from reproduction to structural fix.
- `task-memory-and-state`: Task context persistence in active_task.json, session handoff, and token economy.
- `test-driven-development`: QA RED->GREEN test automation with mandatory cleanDatabase teardown.
- `turborepo`: Turborepo pipeline caching, task filtering, and monorepo build graphs.
- `ui-ux-pro-max`: Semantic design tokens, 100% solid sticky headers, shadcn primitives, motion.
- `vercel-react-best-practices`: React 18 performance, request deduplication via useRef, lean callbacks.

## 4. Full-Stack Orchestra Protocol (`AGENT-04`)

1. **Vertical Tracer Slices Only**: All feature tasks cut end-to-end through DB -> API -> Shared -> UI. Developing isolated backend endpoints without frontend views or frontend views without contracts is prohibited.
2. **Specialized QA Ownership**: Backend and Frontend agents never author automated tests (`BE-08`, `TEST-00`). All test suites live in `e2e/` and are authored exclusively by `@agents_qa`.
3. **Mandatory Production Compilation**: Backend agents MUST run `pnpm --filter @smartfeed/backend-api build` upon code changes to guarantee `dist/` is fresh.
4. **Official shadcn Exclusivity**: Frontend views assemble strictly with official shadcn components (`@/components/ui/*`, `UI-05`), semantic tokens (`UI-02`), and neutral muted icons (`UI-07`).
5. **4-Point Definition of Done (DoD)**:
   - Backend `dist/` is fresh (`pnpm --filter @smartfeed/backend-api build`).
   - Static typecheck (`tsc --noEmit`) passes with 0 errors across all workspace packages.
   - Bilingual parity check (`pnpm i18n:check`) passes 100%.
   - Automated domain invariants check (`pnpm invariants:check`) passes with 0 violations.
