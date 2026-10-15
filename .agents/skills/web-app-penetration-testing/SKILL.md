---
name: web-app-penetration-testing
description: Black-box and source-assisted penetration testing for web applications. Probes running local dev servers and staging environments for authentication bypasses, broken access control, XSS, CSRF, and business logic flaws with working proof-of-concept exploits.
rules:
  - core
  - security
  - testing
---

# Web App Penetration Testing

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/security.md`, and `.agents/rules/testing.md`.
2. Note all web application vulnerability categories and scope limitations in working notes.
3. If running Playwright or security scanners against local ports, verify local dev server health (:3000, :1420, :4000).
4. Do not test out-of-scope production environments without explicit authorization.

## Testing scope and authorization protocol

1. Confirm authorization: Verify target is authorized for testing (staging environment or local host `localhost:3000` / `localhost:1420`). Never test third-party domains without written consent.
2. Exclude destructive endpoints: Mark payment processing gateways, mass email dispatchers, and destructive user wipes out-of-scope during automated sweeps.
3. Multi-account credential testing: Acquire credentials for at least two separate user accounts to test tenant separation and IDOR vulnerabilities.
4. Vulnerability probing:
   - Broken access control: Verify whether authenticated standard users can view administrative dashboards or tenant resources.
   - Cross-Site Scripting (XSS): Probe input forms and feed preview tables with benign HTML and script tags. Confirm framework escaping blocks script execution.
   - Cross-Site Request Forgery (CSRF): Verify that state-changing mutation endpoints require JWT headers or SameSite cookies.
   - Information disclosure: Check responses for server stack traces, database schema details, or unmasked secrets.
5. Proof-of-concept verification: Document every finding with the exact HTTP request or UI interaction script reproducing the vulnerability before authoring remediation plans.
