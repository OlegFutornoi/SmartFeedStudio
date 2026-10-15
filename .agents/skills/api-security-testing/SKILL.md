---
name: api-security-testing
description: Security testing for REST APIs targeting the OWASP API Security Top 10 (2023). Probes for BOLA/IDOR, broken authentication, mass assignment, excessive data exposure, SSRF, and business logic flaws with working proof-of-concept tests.
rules:
  - core
  - security
  - testing
---

# API Security Testing

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/security.md`, and `.agents/rules/testing.md`.
2. Note all API vulnerability categories in working notes (SEC-02, SEC-03, SEC-04).
3. If analyzing OpenAPI specifications or Supertest fixtures, call context7 to verify test runner APIs.
4. Do not report findings without producing a deterministic, reproducible proof-of-concept.

## OWASP API Top 10 testing protocol

1. Broken Object-Level Authorization (API1:2023 - BOLA/IDOR): Test resource access across tenant boundaries. Issue requests with Tenant A token against Tenant B resource IDs (`/api/organizations/:id`, `/api/feeds/:id`). Assert that unauthorized access returns 403 Forbidden or 404 Not Found.
2. Broken Authentication (API2:2023): Probe token expiration, signature forgery, and unauthenticated mutation routes. Assert that missing or invalid JWT tokens return 401 Unauthorized.
3. Broken Object Property Level Authorization (API3:2023): Test for Mass Assignment by injecting unauthorized properties (`role: SUPER_ADMIN`, `isSuperAdmin: true`, `organizationId`) into request bodies. Assert that unwhitelisted fields are stripped or rejected with 400 Bad Request.
4. Unrestricted Resource Consumption (API4:2023): Probe rate limits, unbounded pagination payloads (`take=100000`), and direct plan upgrades. Assert that selecting commercial plans without valid payment returns 402 Payment Required or 403 Forbidden.
5. Broken Function-Level Authorization (API5:2023): Attempt calling administrative endpoints using standard USER role credentials. Assert that non-admin requests return 403 Forbidden.
6. Server-Side Request Forgery (API7:2023 - SSRF): Test feed URL import endpoints against local loopback (`127.0.0.1`, `169.254.169.254`, `localhost`) and DNS rebinding payloads. Assert that connections to internal networks are rejected.
7. Proof-of-concept validation: Every finding must be validated with an automated test in `services/backend-api/test/` asserting rejection and complete `cleanDatabase` cleanup.
