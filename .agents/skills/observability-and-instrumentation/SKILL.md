---
name: observability-and-instrumentation
description: Application observability, structured logging, error tracing with Sentry, and health checks across NestJS backend and React frontend. Governs log levels, correlation IDs, and telemetry hygiene.
rules:
  - core
  - docs_and_ops
---

# Observability and Instrumentation

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Note all logging, tracing, and privacy invariants in working notes.
3. If setting up Sentry or OpenTelemetry, inspect current packages in `services/backend-api`.
4. Do not commit telemetry code that stringifies credentials or tokens.

## Telemetry architecture and standards

1. Structured logging: Log events as structured objects with stable event identifiers, never interpolated strings. Attach `requestId` (correlation ID) to all log events across request lifecycles.
2. Log level conventions:
   - error: System invariants violated, unhandled exceptions, or database disconnects requiring investigation.
   - warn: Degraded but handled states, transient network retries, or rate limit threshold approaches.
   - info: Core business milestones (user registered, feed sync completed, license provisioned).
   - debug: Local troubleshooting details disabled in production environments.
3. Sentry error reporting:
   - Capture unexpected domain exceptions and fatal BullMQ worker job failures in Sentry.
   - Attach context metadata (`userId`, `organizationId`, `jobId`).
   - Strip sensitive values: never attach passwords, authorization headers, or payment card details to Sentry breadcrumbs or tags.
4. Health check endpoints: Provide `/api/health` checking database pool responsiveness, Redis availability, and MinIO S3 bucket access.
