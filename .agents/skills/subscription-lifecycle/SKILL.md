---
name: subscription-lifecycle
description: Enterprise B2B SaaS subscription lifecycle engineering. Governs license provisioning, expiration calculations, quota enforcement (team seats, XML SKUs, AI credits, S3 storage), grace periods, downgrade fallbacks, WayForPay payment webhooks, and OWASP API4 protection against unpaid tier upgrades.
rules:
  - core
  - backend
  - security
---

# Subscription Lifecycle and Quota Enforcement

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/backend.md`, and `.agents/rules/security.md`.
2. Note all subscription, quota, and payment invariants in working notes (BE-06, SEC-02, SEC-03).
3. If modifying payment or quota logic, call context7 or inspect `packages/shared/src/` for current plan contracts.
4. Do not write subscription or license code until steps 1-3 are complete.

## Subscription and license invariants

1. Automatic FREE provisioning: When a user registers (`UserCreatedEvent`), auto-provision an active FREE license with default quotas (1 seat, base SKU limits, base AI credits).
2. Paid plan gating (OWASP API4): Direct calls to select or upgrade to paid tiers (price > 0) without a verified payment transaction must return 402 Payment Required or 403 Forbidden. Commercial plans strictly require an approved `PaymentTransaction` before license activation.
3. WayForPay webhook verification: Verify HMAC MD5/SHA256 signature on all incoming payment webhooks before processing status changes. Process webhook events idempotently using transaction IDs.
4. Quota enforcement across dimensions: Enforce strict quotas before mutations:
   - Team seats: Check `organizationMembers.count < license.maxSeats`. Protect concurrent additions with database transactions or mutex locks to prevent seat theft.
   - XML SKU limits: Verify imported feed item counts against `license.maxSkus`. Block imports exceeding quota.
   - AI credits: Atomically deduct credits on AI enrichments. Return 403 when balance is insufficient.
   - Storage limits: Verify S3 snapshot storage against `license.maxStorageMb`.
5. Expiration and grace periods: Calculate expiration dynamically from payment approval date. Provide configurable grace period (e.g. 7 days) upon expiration before downgrading to FREE or suspending paid features.
6. Downgrade fallbacks: When downgrading from PRO/ENTERPRISE to FREE, do not delete user data immediately. Mark excess team seats or feeds as suspended/inactive until re-upgraded or explicitly deleted.
