---
name: pw-data
description: Test data generator & domain reference skill for SmartFeed Studio E2E. Use when generating, formatting, or validating test data for catalogs (XML/CSV feeds, supplier profiles, SKU products, category mapping, pricing rules, licenses, and organizations) using unique test identifiers (runId, testEmail).
---

# Test Data Management (`pw-data`)

Standards for generating isolated, deterministic test data for SmartFeed Studio E2E.

---

## 1. Test Isolation via `runId`

To guarantee 100% test isolation under parallel execution:

- Generate a unique test run prefix using `@/core/data/test-id`.
- Suffix all created entities (supplier names, organization names, feed names): `[E2E] Supplier ${runId}`.
- Format test emails: `e2e.test+<timestamp>@smartfeed.local`.

---

## 2. Catalog Test Data

- XML Feeds: sample XML product data with standard Prom / Rozetka / Horoshop tags (`<offer>`, `<price>`, `<name>`, `<categoryId>`).
- CSV Feeds: semicolon- or comma-delimited product records with column mapping headers.
- Currency & Bank Rates: valid ISO codes (`UAH`, `USD`, `EUR`) and positive exchange rates.

---

## 3. Data Teardown Guarantees

- Server PostgreSQL: All created entities must be registered and deleted via `server/backend/db/cleanup.ts` in strict foreign key dependency order. Never delete manual seed accounts (`qatest@gmail.com`, `shoplinkerxml@gmail.com`).
- Local SQLite Docker container: Reset database state between runs via `POST http://localhost:5001/api/reset`.
