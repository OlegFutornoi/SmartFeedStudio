---
name: performance-optimization
description: Full-stack performance optimization across frontend, NestJS CQRS backend, and PostgreSQL 16. Governs latency budgets, profiling, query execution plans, memory management, and Core Web Vitals.
rules:
  - core
  - testing
---

# Performance Optimization

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/testing.md`.
2. Note all performance thresholds and invariants in working notes.
3. If analyzing PostgreSQL query plans, call postgres MCP `explain_query`. If analyzing web performance, call context7.
4. Do not optimize speculatively without baseline profiling measurements.

## Profiling and measurement workflow

1. Measure baseline first: Establish concrete metrics before changing code. Never guess where bottlenecks exist.
2. Frontend performance metrics:
   - Target Largest Contentful Paint (LCP) under 2.5 seconds.
   - Target Interaction to Next Paint (INP) under 200 milliseconds.
   - Target Cumulative Layout Shift (CLS) under 0.1.
   - Prevent duplicate network calls on mount using `useRef` guards.
3. Backend and API performance:
   - Target p95 response times under 200 milliseconds for standard read queries.
   - Use cursor pagination (`take`, `cursor`) on high-volume catalog feeds. Never use `OFFSET` pagination on large datasets.
   - Eliminate N+1 query patterns by using batch `findMany({ where: { id: { in: ids } } })` or relation `include`/`select`.
4. Database profiling:
   - Run `EXPLAIN (ANALYZE, BUFFERS)` on slow queries using postgres MCP.
   - Verify that all lookup and join foreign keys hit indexes rather than Sequential Scans.
   - Maintain GIN indexes with `pg_trgm` on ILIKE text search columns (`email`, `fullName`).
5. Memory backpressure:
   - Use event-driven SAX parsing (`saxes`) for XML/CSV files exceeding 5 MB.
   - Pause readable streams when chunk processing queues are saturated.
