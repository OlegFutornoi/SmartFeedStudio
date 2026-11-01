#!/usr/bin/env node

/**
 * normalize-skill-descriptions.mjs
 * Audits and standardizes frontmatter descriptions across all 62 skills.
 * Enforces Anthropic standard:
 *   - Begins with a concise one-sentence capability summary
 *   - Explicit "Use when <triggers & keywords>"
 *   - Explicit "Do not use for <adjacent domain>; use <other-skill>"
 *   - Length <= 1024 characters, no XML tags
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, '.agents/skills');

const DESCRIPTIONS = {
  'ai-sdk':
    'Vercel AI SDK integration for text generation, streaming, tool loops, structured JSON outputs, and embedding workflows in NestJS and React. Use when building AI streaming endpoints, tool-calling pipelines, or LLM-driven catalog enrichment. Do not use for external documentation scraping; use firecrawl-parse or context7 instead.',
  'api-anything':
    'Reverse-engineers website frontend traffic into typed JSON APIs and executes fast direct HTTP calls with automatic self-healing via api-anything MCP. Use when Planner or Review agents need to inspect competitor catalog endpoints, verify live payload structures against @smartfeed/shared contracts, test pricing extraction, or perform catalog enrichment without heavy DOM scraping. Do not use for standard internal backend CQRS endpoints; use backend or nestjs-best-practices instead.',
  'api-security-testing':
    'Security testing for REST APIs targeting the OWASP API Security Top 10 (2023). Probes for BOLA/IDOR, broken authentication, mass assignment, excessive data exposure, SSRF, and business logic flaws with working proof-of-concept tests. Use when auditing backend endpoints, validating authorization boundaries, or testing mutation routes for tenant leaks. Do not use for frontend visual testing; use playwright-automation or browser-debugging instead.',
  'automated-guardrails-ci':
    'Automated guardrails enforcement via ESLint rules, TypeScript strict flags, pre-commit hooks, and CI pipelines. Converts policy invariants into machine-enforced blocking checks. Use when adding machine-enforced architectural invariants, configuring lint-staged, or auditing CI gates. Do not use for writing application business logic; use backend or frontend instead.',
  backend:
    'Enterprise full-cycle backend CQRS engineering lifecycle orchestrator for SmartFeed Studio (NestJS 11, Prisma ORM, PostgreSQL 16, Redis, BullMQ). Use when designing, building, refactoring, securing, or testing backend controllers, CQRS commands/queries, services, Prisma schemas, database migrations, and BullMQ workers. Do not use for frontend React views or Tauri client UI; use frontend instead.',
  brainstorming:
    'Explores and discovers user needs, creative concepts, alternative approaches, and design trade-offs before implementation. Use when initiating new features, exploring unmapped user requirements, comparing multiple design paths, or evaluating trade-offs. Do not use for step-by-step TDD task execution; use planning-and-lifecycle or writing-plans instead.',
  'browser-debugging':
    'Live interactive browser debugging, DOM tree inspection, console log analysis, screenshot capture, and network request inspection using direct Playwright MCP tools in SmartFeed Studio. Use when diagnosing client-side UI bugs, visual regressions, missing DOM elements, hydration mismatches, or network errors in real time. Do not use for server-side Jest unit testing; use systematic-debugging instead.',
  'bullmq-jobs':
    'Asynchronous job queue processing with NestJS 11 and BullMQ on Redis 7. Governs bounded retries, exponential backoff, dead letter queues (DLQ), worker concurrency, memory backpressure, and idempotent processors. Use when creating background queue processors, handling feed ingestion jobs, or configuring Redis retry mechanics. Do not use for direct client-facing HTTP mutations; use backend or nestjs-best-practices instead.',
  'ci-cd-and-automation':
    'Continuous integration and deployment pipeline engineering. Governs automated quality gates, linting, type checks, build validation, and GitHub Actions workflow management. Use when creating or updating GitHub Actions workflows, setting up CI test pipelines, or configuring branch protection gates. Do not use for local desktop builds; use tauri-v2-security-and-ipc or devops instead.',
  'code-review-and-quality':
    'Comprehensive 5-axis code review and quality gating. Use when reviewing pull requests, inspecting diffs, validating changes against architectural invariants, or verifying pre-commit quality gates. Do not use for implementing feature code; use backend or frontend instead.',
  'code-simplification':
    'Refactors code to reduce unnecessary complexity while preserving exact runtime behavior and contract invariants. Use when features are functioning to clean up bloated logic, eliminate nested branches, and improve maintainability. Do not use for adding new functional capabilities; use backend or frontend instead.',
  'context-engineering':
    'Context window optimization and prompt token economy for AI coding agents. Governs rule-loading sequences, targeted file reading, and prevention of context pollution. Use when managing always-on instruction budgets, trimming prompt sizes, or configuring progressive disclosure. Do not use for application data compression; use headroom-compression instead.',
  'contract-first-api':
    'Contract-first API engineering using shared Zod schemas, TypeScript DTOs, and enums in packages/shared. Use when defining new endpoints, altering payload shapes, or synchronizing client and server models. Do not use for database migrations; use prisma-postgres-mastery instead.',
  'documentation-and-adrs':
    'Architecture Decision Records (ADRs) and continuous knowledge base documentation. Governs wiki synchronization, architectural trade-off recording, and API reference accuracy. Use when recording major architectural decisions, updating wiki docs, or documenting public interfaces. Do not use for drafting bite-sized implementation tasks; use writing-plans instead.',
  'doubt-driven-development':
    'Adversarial cross-examination of non-trivial architectural decisions, concurrency races, quota bypasses, and TOCTOU edge cases. Use when verifying critical security, database, or subscription logic. Do not use for routine styling or simple CRUD endpoints; use frontend or backend instead.',
  'emil-design-eng':
    'Motion design and interactive animation engineering for React, Tailwind CSS, and Framer Motion in SmartFeed Studio. Use when implementing micro-interactions, modal transitions, spring animations, active button states, hover dynamics, or responsive feedback timing. Do not use for server logic or data fetching; use frontend instead.',
  'find-skills':
    'Discovers and installs skills from the open agent skills ecosystem using the Skills CLI. Use when searching for specialized third-party agent capabilities or tooling templates. Do not use for internal project refactorings; use skill-creator instead.',
  'firecrawl-parse':
    'Document parsing and extraction (PDF, DOCX, XLSX, HTML) into markdown via Firecrawl CLI or MCP. Use when ingesting external supplier catalogs or converting document specifications. Do not use for live interactive browser testing; use browser-debugging or playwright-automation instead.',
  'fix-security-vulnerabilities-with-strix':
    'Systematic remediation of security vulnerabilities identified by pentests or audits. Governs root-cause patching, defensive regression tests, and verification re-scans. Use when patching confirmed security vulnerabilities, SSRF issues, or authentication bypasses. Do not use for general feature bug fixing; use systematic-debugging instead.',
  frontend:
    'Enterprise full-cycle frontend engineering lifecycle orchestrator for SmartFeed Studio (React 18, Next.js 14, Tauri v2 desktop UI, Tailwind CSS, shadcn/ui, Playwright). Use when building, refactoring, styling, reviewing, or testing pages, components, dialogs, hooks, and local mock drivers in apps/desktop or apps/admin-portal. Do not use for server-side CQRS handlers or cloud database migrations; use backend instead.',
  'git-commit':
    'Controlled git commit and release workflow. Enforces pre-commit build verification, Conventional Commits, plain branch pushes, and on-demand SemVer release tagging. Use when explicitly requested to commit changes, prepare a git release, or format commit messages. Do not use for autonomous commits without explicit user command (CORE-10); ask first.',
  handoff:
    'Compact the current conversation into a structured handoff document for another agent or session to pick up. Use when transitioning across sessions, handing off between specialized agents, or summarizing execution state. Do not use for persistent task memory updates; use task-memory-and-state instead.',
  'headroom-compression':
    'Optimizes context tokens by translating and compressing plans, specs, and feeds through local Python Headroom engine and direct multi-provider AI fallback before passing them to the active model. Automatically delegates non-complex translation/distillation of Ukrainian specs to zero-cost AI models, saving 65-75% tokens via dense English BPE compression. Use when compressing large files, plans, or diffs (>80 KB). Do not use for caching MCP docs; use mcp-knowledge-cache instead.',
  'i18n-localization':
    'Internationalization (i18n) and dictionary parity verification across Ukrainian (uk) and English (en) locales in SmartFeed Studio. Use when adding or editing UI copy, dialogs, forms, toasts, buttons, tooltips, backend error mappings, or running pnpm i18n:check. Do not use for server database queries; use backend or database skills instead.',
  'idempotency-and-outbox':
    'Idempotency keys, Transactional Outbox pattern with Prisma, BullMQ retry mechanics, and Dead-Letter Queue processing for resilient CQRS mutations. Use when designing mutation handlers, webhook publishing, or payment event processing. Do not use for idempotent GET queries; use backend or nestjs-best-practices instead.',
  image:
    'Media asset generation, Sharp WebP image compression, product photo optimization, and placeholder management in SmartFeed Studio. Use when optimizing product catalog photos, generating WebP thumbnails, compressing hero illustrations, or configuring image loading placeholders. Do not use for server database queries; use backend or database skills instead.',
  'incremental-implementation':
    'Thin vertical slicing of multi-file features into independently verifiable, testable increments under 250 lines. Use when executing complex plans or multi-stage refactorings. Do not use for initial brainstorming or requirement discovery; use brainstorming instead.',
  'interview-me':
    'Clarifies underspecified requirements through structured, single-question inquiries with attached hypotheses until target confidence (95%) is achieved. Use when user requests lack clear constraints, users, or success metrics. Do not use for already fully specified requirements; use writing-plans instead.',
  'lessons-learned-registry':
    'Historical registry of solved error classes, known project gotchas, and architectural invariants. Use when starting tasks to review known pitfalls and after bug fixes to codify new invariants. Do not use for live application error monitoring; use observability-and-instrumentation instead.',
  'mcp-knowledge-cache':
    'Cache-first MCP knowledge retrieval, single-file Headroom compression (.compressed.md), and OmniRoute-delegated cache refreshing in .agents/cache/mcp/. Use when calling external documentation or research MCP tools (context7, perplexity-agent-api, firecrawl, api-anything, shadcn) so agents reuse verified knowledge without redundant external requests. Do not use for application runtime Redis caching; use backend instead.',
  'mock-real-parity':
    'Enforces 100% behavioral and data parity between browser in-memory mock mode (mockDatabaseDriver), desktop native SQLite (Tauri v2), and cloud backend API (NestJS + PostgreSQL) in SmartFeed Studio. Use when designing mock drivers, implementing catalog operations, verifying relation hydration, testing cascade deletions, or aligning error responses. Do not use for general frontend styling; use frontend or ui-ux-pro-max instead.',
  'nestjs-best-practices':
    'NestJS 11 CQRS architecture, modularity, dependency injection, validation, and error handling. Use when creating or modifying NestJS modules, controllers, CQRS commands, queries, handlers, services, and validation pipes. Do not use for frontend Next.js App Router; use frontend instead.',
  'observability-and-instrumentation':
    'Application observability, structured logging, error tracing with Sentry, and health checks across NestJS backend and React frontend. Governs log levels, correlation IDs, and telemetry hygiene. Use when configuring Sentry monitoring, setting up structured logging, or tracing errors. Do not use for manual code reviews; use review or code-review-and-quality instead.',
  'omniroute-delegation':
    'Dispatches tasks, batch catalog processing, prompt testing, translation, or reasoning workloads directly to zero-cost multi-provider AI fallback (Google AI Studio, Groq Cloud, OpenRouter). Use when the user requests tasks via OmniRoute, asks to use DeepSeek or alternative upstream models, or when running high-volume LLM workloads (spec translation, cache synthesis, catalog enrichment) that should not consume IDE tokens. Do not use for standard IDE pair programming, code refactoring, or database queries; use backend or frontend instead.',
  'penetration-testing-with-strix':
    'Autonomous penetration testing using the Strix security engine. Exploits and validates vulnerabilities across web applications, REST APIs, and repositories, returning validated proof-of-concept reports. Use when executing comprehensive red-team penetration tests on running environments. Do not use for fixing vulnerabilities; use fix-security-vulnerabilities-with-strix instead.',
  'performance-optimization':
    'Full-stack performance optimization across frontend, NestJS CQRS backend, and PostgreSQL 16. Governs latency budgets, profiling, query execution plans, memory management, and Core Web Vitals. Use when diagnosing slow response times, reducing page load latency, profiling memory leaks, or tuning CPU usage. Do not use for initial feature design; use backend or frontend instead.',
  'perplexity-agent-api':
    'Web-grounded live search, marketplace research, and multi-provider reasoning via Perplexity Agent API (POST /v1/agent). Use when agents need real-time web facts, marketplace feed format specifications (Rozetka, Prom.ua, Horoshop), competitor pricing models, or supplier catalog documentation with search_results citations and structured JSON output. Do not use for local SQLite queries or internal code refactoring; use context7 or prisma-postgres-mastery instead.',
  'planning-and-lifecycle':
    'Deterministic implementation planning, specification drafting, architectural invariant validation, and plan lifecycle management. Governs plans in plans/active/, plans/backlog/, and plans/completed/. Use when authoring vertical tracer slices, organizing tasks, or managing plan status transitions. Do not use for writing production feature code; use backend or frontend instead.',
  'playwright-automation':
    'Playwright E2E and UI test automation for Desktop and Admin Portal in SmartFeed Studio. Use when writing, refactoring, or running Playwright test specs, designing Page Object Models, asserting network deduplication (requestCount === 1), verifying bilingual localization (UA <-> EN), or checking test isolation. Do not use for backend Jest unit/integration tests; use test-driven-development instead.',
  'postgresql-optimization':
    'PostgreSQL 16 advanced query optimization, EXPLAIN ANALYZE diagnosis, GIN pg_trgm text search indexing, JSONB performance, and cursor pagination in SmartFeed Studio. Use when diagnosing slow SQL queries, optimizing high-volume product lookups, adding GIN indexes for ILIKE search, or replacing OFFSET pagination. Do not use for frontend components or raw schema migrations; use prisma-postgres-mastery instead.',
  'prisma-postgres-mastery':
    'Prisma ORM and PostgreSQL 16 schema design, migrations, indexing, pooling, and query patterns. Use when modifying schema.prisma, writing queries, planning expand/contract migrations, or optimizing database operations. Do not use for client-side SQLite in Tauri; use rust-native-backend instead.',
  'project-context-map':
    'Monorepo system topology, service ports, directory boundaries, and data flow navigation. Use when starting tasks to locate domain code without full repository scans. Do not use for deep code refactoring; use backend or frontend instead.',
  'release-and-rollback':
    'Semantic versioning, changelog generation, post-deployment health verification, and zero-data-loss rollback procedures. Use when tagging releases, deploying to production, or managing deployment rollbacks. Do not use for day-to-day code commits; use git-commit instead.',
  review:
    'Enterprise full-cycle code review and quality assurance audit orchestrator for SmartFeed Studio. Use when inspecting code quality, auditing architecture boundaries, detecting security flaws, verifying PostgreSQL indexing, checking component modularity, or reviewing pull requests. Do not use for writing production feature code; use frontend or backend instead.',
  'rust-native-backend':
    'Native Rust backend engineering in Tauri v2 (apps/desktop/src-tauri). Governs SQLCipher encrypted SQLite (rusqlite), schema migrations, atomic transactions, thiserror error handling, IPC commands, and cargo clippy linting. Use when developing or debugging Tauri desktop SQLite logic, encrypted storage, or native OS IPC. Do not use for cloud PostgreSQL migrations; use prisma-postgres-mastery instead.',
  'secret-serialization':
    'Audits code for credential, token, and password leaks through object serialization, JSON.stringify, logging, Sentry telemetry, and HTTP responses. Use when adding credential fields or telemetry sinks. Do not use for general REST route testing; use api-security-testing instead.',
  'security-and-hardening':
    'Application security hardening, 4-layer defense, OWASP Top 10 mitigation, secret masking, command injection defense, and SSRF prevention. Use when implementing auth, data persistence, mutation routes, or external integrations. Do not use for general UI styling; use frontend or ui-ux-pro-max instead.',
  'skill-creator':
    'Meta-skill for authoring, auditing, optimizing, and benchmarking modular skills in SmartFeed Studio. Use when creating a new skill from scratch, refactoring an existing skill, enforcing the mandatory skill template, auditing skills for prompt efficiency and line budgets (<250 lines), optimizing triggering descriptions, or synthesizing recurring user corrections. Do not use for general application code edits; use frontend or backend instead.',
  'source-driven-development':
    'Authoritative documentation protocol for grounding library APIs via Context7 MCP tools or ctx7 CLI. Use when adopting new libraries, designing non-trivial framework integrations, verifying version-specific APIs, or troubleshooting unfamiliar SDK behavior. Do not use for standard language primitives, trivial utilities, or repetitive internal refactoring; use context-engineering instead.',
  'spec-driven-development':
    'Specification creation and capability mapping before code execution (absorbed into planning-and-lifecycle). Use when drafting high-level capability maps or breaking large initiatives into module specs. Do not use for vertical tracer-bullet plans; use planning-and-lifecycle instead.',
  'streaming-large-feeds':
    'High-volume streaming XML and CSV parsing for 100k+ SKU catalogs with Node.js stream backpressure, chunked BullMQ ingestion, and memory leak prevention. Use when importing, exporting, or parsing large catalog files. Do not use for small REST payloads; use backend instead.',
  'subscription-lifecycle':
    'Enterprise B2B SaaS subscription lifecycle engineering. Governs license provisioning, expiration calculations, quota enforcement (team seats, XML SKUs, AI credits, S3 storage), grace periods, downgrade fallbacks, WayForPay payment webhooks, and OWASP API4 protection against unpaid tier upgrades. Use when implementing subscription logic, billing webhooks, or quota gating. Do not use for general user auth; use backend instead.',
  'systematic-debugging':
    'Four-phase systematic debugging methodology. Use when diagnosing test failures, production defects, performance bottlenecks, or unexpected behavior to locate root cause before proposing fixes. Do not use for initial greenfield feature planning; use planning-and-lifecycle instead.',
  'task-memory-and-state':
    'Task context persistence, execution state checkpointing, session handoff, and prompt token optimization in .agents/state/active_task.json. Use when starting tasks to load active task state and at stage gates to persist modified files and handoffs. Do not use for application business state; use backend or database instead.',
  'tauri-v2-security-and-ipc':
    'Tauri v2 native desktop security. Governs capabilities and permission scoping, secure IPC commands, SQLCipher key derivation via OS Keychain, path traversal defense, and safe filesystem operations. Use when configuring Tauri permissions, security policies, OS Keychain, or native desktop commands. Do not use for cloud server APIs; use backend instead.',
  'test-driven-development':
    'Test-driven development methodology enforcing the RED-GREEN-REFACTOR cycle, complete database teardown, targeted test execution, and real business invariant assertions. Use when implementing new features or fixing bugs with automated tests. Do not use for manual exploratory testing; use browser-debugging instead.',
  'to-tickets':
    'Breaks a plan, spec, or active architecture roadmap into a set of tracer-bullet tickets, each declaring its blocking edges. Use when slicing large architectural initiatives into discrete, independently executable tasks. Do not use for direct coding; use backend or frontend instead.',
  turborepo:
    'Turborepo monorepo pipeline orchestration, build caching, task filtering, and dependency graphs. Use when configuring turbo.json, optimizing monorepo builds, setting up workspace packages, or tuning CI pipeline speed. Do not use for general npm script authoring; use package.json scripts instead.',
  'ui-ux-pro-max':
    'UI/UX design intelligence, semantic theming, accessibility, and component layout standards for SmartFeed Studio. Use when creating or styling UI pages, designing data tables, configuring color tokens, enforcing 100% solid sticky headers, removing duplicate action buttons, or installing official shadcn components. Do not use for backend CQRS or database queries; use backend or database skills instead.',
  'vercel-react-best-practices':
    'React 18 and Next.js 14 performance optimization patterns for SmartFeed Studio. Use when optimizing React components, eliminating waterfall requests, guarding against concurrent duplicate requests via useRef, reducing bundle size, or optimizing re-renders on large catalogs. Do not use for server database queries; use backend or database skills instead.',
  'web-app-penetration-testing':
    'Black-box and source-assisted penetration testing for web applications. Probes running local dev servers and staging environments for authentication bypasses, broken access control, XSS, CSRF, and business logic flaws with working proof-of-concept exploits. Use when testing running local dev servers or staging portals for web vulnerabilities. Do not use for static code linting; use automated-guardrails-ci instead.',
  'writing-plans':
    'Bite-sized, testable TDD implementation steps (2-5 min) with explicit file boundaries and interfaces. Use when you have a spec or requirements for a multi-step task, before touching code. Do not use for broad roadmap brainstorms; use brainstorming instead.',
};

async function main() {
  let updatedCount = 0;
  for (const [skill, desc] of Object.entries(DESCRIPTIONS)) {
    const skillPath = path.join(SKILLS_DIR, skill, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    let text = fs.readFileSync(skillPath, 'utf8');
    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) continue;

    const currentFm = fmMatch[1];
    if (currentFm.includes('description:')) {
      const newFm = currentFm.replace(
        /description:\s*([^\r\n]*(?:\r?\n\s+[^\r\n]*)*)/,
        `description: ${desc}`
      );
      text = text.replace(fmMatch[0], `---\n${newFm}\n---`);
      fs.writeFileSync(skillPath, text, 'utf8');
      updatedCount++;
    }
  }
  console.log(`Updated descriptions for ${updatedCount} skills to Anthropic standard.`);
}

main();
