---
name: pw-test-designer
description: >-
  Insurance test design and scenario modeling skill for insurance-e2e. Use when planning new E2E UI or API test suites to structure tests according to the 7-phase Lead Flow Schema (Lead -> Draft -> Offer -> OTP -> Payment -> Policy -> Email), boundary value analysis, negative status matrices (401/403/404/405/409/422), and Data Parity validation.
---

# Insurance Test Designer (`pw-test-designer`)

Autonomous test design and scenario modeling engine for insurance domains (OSAGO, Green Card, Travel). Defines lead lifecycle stages, boundary value matrices, negative status mappings, and data parity invariants.

---

## 1. Lead Flow Schema (7 Business Stages)

E2E flows and API transitions must map to these sequential stages:

1. Lead Creation: CRM creates/accepts lead, captures vehicle and customer contact attributes.
2. Draft Creation: EWA validates customer email, creates contract draft in `DRAFT` state.
3. Offer Creation: Tariff quote and commercial proposal PDF generation.
4. OTP Verification: Contract transition initiated (`state/REQUEST`, CRM `заявлено`), SMS/Viber OTP dispatched and verified.
5. Payment: Payment invoice generated via Portmone/LiqPay, successful postback/callback.
6. Policy & Issuance: Transition to `EMITTED` (`оформлено`), policy number generated.
7. Email Delivery: Mailer service dispatches policy documents to customer email.

Diagnostic Rule: Any API failure during transition to the next stage logically belongs to the stage being initiated (e.g., failure during `state/REQUEST` belongs to Stage 4: OTP Verification).

---

## 2. OSAGO Domain Equivalence Classes

1. Vehicle Categories (`vehicle_category`):
   - Passenger cars: B1 (<1600 cm3), B2 (1601-2000 cm3), B3 (2001-3000 cm3), B4 (>3000 cm3), B5 (Electric).
   - Other categories: Trailers (F), Trucks (C1, C2), Buses (D1, D2), Motorcycles (A1, A2).

2. Registration Zones:
   - Zone 1: Kyiv (maximum K2 coefficient).
   - Zones 2-5: Regional centers, satellite towns, district centers.
   - Zone 6: Rural areas and small towns.

3. Privilege Status:
   - `None`: Standard tariff without privileges.
   - `Pensioner`: 50% discount.
   - `Invalid`: Group 2 disability.
   - `WarParticipant`: Combatants (UBD).
   - Constraint: Privileges prohibited for engine volumes > 2500 cm3 or commercial vehicles.

4. Customer Validation Constraints:
   - Tax ID (RNOKPP): Exactly 10 digits with valid birthdate checksum.
   - Phone Number: Ukrainian E.164 format `+380XXXXXXXXX`.
   - Email: RFC-compliant string.
   - Age: >= 18 years old.

---

## 3. Full Boundary & Nullability Matrix

Every payload field under test must be validated across all applicable boundary classes:

- String Fields:
  - Empty string: `""` -> 422
  - Whitespace only: `"   "` -> 422
  - JSON null: `null` -> 422
  - Explicit undefined (omitted key): `undefined` -> 422
  - Type confusion string literals: `"null"`, `"undefined"` -> 422
  - Length boundaries: `min - 1`, `max + 1`, forbidden special characters -> 422

- Number Fields:
  - `null`, `undefined`, `""`, `"null"`, `"undefined"` -> 422
  - Negative values: `-1` -> 422
  - Zero: `0` (when positive required) -> 422
  - Float instead of integer: `12.34` -> 422

- Date Fields:
  - `null`, `undefined`, `""`, `"null"`, `"undefined"` -> 422
  - Malformed date string: `"invalid-date"` -> 422
  - Chronological invalidity: past date when future required, far future -> 422

- Boolean Fields:
  - `null`, `undefined`, `""`, `"null"`, `0`, `1`, `"true"`, `"false"` -> 422 or schema default

- Headers & Session Tokens:
  - Missing header, `""`, `"   "`, `"null"`, invalid session token -> 401 / 403

- Entity Identifiers (UUID):
  - Non-existent valid UUID (`00000000-0000-0000-0000-000000000000`) -> 404
  - Malformed string (`"not-a-uuid"`) -> 422

- HTTP Routing & Method:
  - Method mismatch (`POST` instead of `GET`) -> 405 (never fuzzy `[404, 405]`)

---

## 4. Data Parity Invariants

Positive scenarios must mirror submitted inputs against saved lead entities:

- Customer: `taxNumber`, `phone`, `email`, `firstName`, `lastName`.
- Vehicle: `licensePlate`, `vinCode`, `engineVolume`, `brand`, `model`.
- Financial: Submitted tariffs and payments must match database values to the exact kopeck via `assertPaymentInvariants()`.
