---
name: fix-security-vulnerabilities-with-strix
description: Systematic remediation of security vulnerabilities identified by pentests or audits. Governs root-cause patching, defensive regression tests, and verification re-scans.
rules:
  - core
  - security
  - testing
---

# Fix Security Vulnerabilities

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/security.md`, and `.agents/rules/testing.md`.
2. Note all vulnerability classifications (CWE/OWASP) and affected components in working notes.
3. If patching third-party dependencies or framework features, query context7 for security advisories.
4. Do not mark vulnerabilities resolved without verification re-testing.

## Remediation protocol

1. Finding triage and prioritization: Order remediation work by severity: Critical, High, Medium, Low. Inspect the proof-of-concept request and reproduction steps in `vulnerabilities/*.md`.
2. Root cause resolution:
   - Fix the structural root cause rather than patching specific exploit payloads.
   - For SQL/NoSQL injection: Ensure 100% parameterization via Prisma ORM; never use raw unsanitized query strings.
   - For IDOR/BOLA: Enforce tenant ownership checks at the handler/service boundary (`WHERE organizationId = user.orgId`).
   - For Mass Assignment: Add `class-validator` decorators to DTOs and verify `ValidationPipe({ whitelist: true })` strips unwhitelisted fields.
   - For secret exposure: Exclude secrets from responses, mask credentials in settings endpoints, and rotate compromised keys immediately.
   - For SSRF: Enforce IP allowlists and pin resolved IPs prior to HTTP requests.
3. Defensive regression tests: Author an automated E2E test reproducing the initial exploit. Confirm that the exploit fails with 400, 401, 403, or 404 after applying the fix.
4. Verification re-scan: Re-run targeted security scans or execute the reproduction script against the patched branch to confirm the vulnerability is closed. Confirm zero test regressions (`tsc --noEmit`, targeted test suites).
