---
name: pw-test-designer
description: Test design and scenario modeling skill for SmartFeed Studio E2E. Use when planning new E2E UI or API test suites to structure tests according to catalog lifecycle stages (Supplier -> Feed Ingestion -> Mapping -> Sync -> Pricing Rules -> Export), boundary value analysis, negative status matrices (400/401/403/404/409/422), and Data Parity validation.
---

# Test Designer (`pw-test-designer`)

Autonomous test design and scenario modeling engine for SmartFeed Studio. Defines catalog lifecycle stages, domain equivalence classes, boundary value matrices, negative status mappings, and data parity invariants.

---

## 1. Catalog & Feed Lifecycle Schema

E2E flows and API transitions map to these sequential stages:

1. Supplier Setup: Create supplier profile, configure credentials/URL, verify active state.
2. Feed Ingestion: Ingest XML/CSV feed, parse structure, validate XML/CSV tags with backpressure.
3. Category & Column Mapping: Map source columns/categories to catalog target schema.
4. Product Reconciliation & Margins: Apply pricing rules, currency conversions, and margin rules.
5. Catalog Sync & Storage: Persist products to local SQLite (Desktop) or S3/PostgreSQL (Server).
6. Export Channels: Generate distribution feeds for marketplaces (Rozetka, Prom, Horoshop).

---

## 2. SmartFeed Domain Equivalence Classes

1. Feed Formats:
   - XML: YML, Google Merchant XML, Prom XML, Rozetka XML, Horoshop XML.
   - CSV: Comma-separated, Semicolon-separated, Tab-separated.

2. Catalog Volume:
   - Micro: 1-100 SKUs.
   - Medium: 1,000-10,000 SKUs.
   - Heavy: 100,000+ SKUs (streaming backpressure and chunked processing).

3. Subscription Tiers & Quotas:
   - Free: 1 team seat, 500 SKUs, 0 AI credits.
   - Pro: 5 seats, 25,000 SKUs, 500 AI credits.
   - Enterprise: Unlimited seats, 250,000+ SKUs, custom storage.

---

## 3. Boundary & Nullability Matrix

For every payload and form field, test cases must cover:

1. `""` (empty string) -> 400 Bad Request / validation message.
2. `"   "` (whitespace-only) -> treated as empty.
3. `null` -> explicit nullability check.
4. `undefined` (omitted or explicitly undefined) -> default fallback.
5. Numeric bounds: `-1`, `0`, floats vs integers, max safe integer.
6. Strings: `min - 1`, `max + 1`, special symbols (`<>&"'`), unicode Cyrillic.
