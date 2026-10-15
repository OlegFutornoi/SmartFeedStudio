---
name: penetration-testing-with-strix
description: Autonomous penetration testing using the Strix security engine. Exploits and validates vulnerabilities across web applications, REST APIs, and repositories, returning validated proof-of-concept reports.
rules:
  - core
  - security
  - testing
---

# Autonomous Penetration Testing with Strix

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/security.md`, and `.agents/rules/testing.md`.
2. Note all scope boundaries, rate limits, and vulnerability categories in working notes.
3. Verify tool prerequisites (Docker running, Strix CLI installed via `strix --version`).
4. Do not run unconstrained scans without setting `--max-budget` and headless mode `-n`.

## Execution workflow

1. Target selection and scope configuration:
   - Pass OpenAPI or Swagger spec targets (`-t ./openapi.yaml`) alongside live endpoints (`-t https://staging.example.com`).
   - For local development code, target the repository (`-t ./`).
   - Define scope instructions via `--instruction` specifying test accounts, allowed routes, and excluded paths (e.g. `--instruction "Test accounts: orgA, orgB. Exclude /billing"`).
2. Scan execution parameters:
   - Always run with `-n` (non-interactive/headless mode).
   - Set spend budget cap via `--max-budget <USD>` to prevent unbounded API consumption.
   - Select scan mode: `quick` for fast developer feedback, `standard` for comprehensive validation.
3. Artifact inspection and exploit validation:
   - Inspect `strix_runs/<run>/penetration_test_report.md` for executive summaries.
   - Inspect individual findings in `vulnerabilities/*.md`. Every valid finding contains reproduction steps and proof-of-concept exploit scripts.
   - Replay the proof-of-concept manually to confirm reachability and impact before opening remediation tasks.
4. Exit code handling:
   - Exit code 0 indicates no exploitable vulnerabilities found in analyzed scope.
   - Exit code 2 indicates validated vulnerabilities were discovered.
   - Exit code 1 indicates fatal execution or environment errors.
