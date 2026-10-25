---
name: pw-data
description: Test data generator & domain reference skill for insurance-e2e (finance.ua / minfin.ua). Use when generating, formatting, or validating test data for Ukrainian insurance products (OSAGO, Green Card, Travel), including TIN (RNOKPP), vehicle plates (VRM)/VIN, passports/ID cards/UBD, exemption categories, and Faker generators in utils/leadRandom.ts.
---

# Test Data & Domain Rules (`pw-data`)

Test data provisioning, domain reference, and lifecycle cleanup standards for Ukrainian insurance products (OSAGO, Green Card, Travel, DGO).

---

## 1. Primary Data Sources

### A. Lead Generators (`@/utils/leadRandom`)

Use Faker-based lead generators for randomized, schema-valid payloads:

- `generateOsagoLead()`: Complete OSAGO lead DTO (`key`, `vehicle_category`, `vin`, `registration_identifier`, `tax_code`, `birth_date`).
- `generateGreenCardLead()`: Green Card lead DTO.
- `generateTravelLead()`: Travel insurance lead DTO.
- `generateDgoLead()`: Voluntary third-party liability (DGO) lead DTO.

### B. Standard Constants (`@/appConstants`)

For deterministic positive UI and API tests, import constants from `@/appConstants`:

```typescript
import {
  DEFAULT_EMAIL,
  DEFAULT_FIRST_NAME,
  DEFAULT_LAST_NAME,
  DEFAULT_MIDDLE_NAME,
  DEFAULT_PASSPORT_NUMBER,
  DEFAULT_PASSPORT_SERIES,
  DEFAULT_PHONE_E164,
  DEFAULT_REGISTRATION_ADDRESS,
  DEFAULT_TAX_ID,
} from '@/appConstants';
```

- Phone: `DEFAULT_PHONE_E164` (`+380XXXXXXXXX`)
- Tax ID (RNOKPP): `DEFAULT_TAX_ID` (`2911200000`, 10 digits with valid birthdate checksum)
- Name: `DEFAULT_FIRST_NAME`, `DEFAULT_LAST_NAME`, `DEFAULT_MIDDLE_NAME`
- Passport: `DEFAULT_PASSPORT_SERIES` (`АА`), `DEFAULT_PASSPORT_NUMBER` (`123456`)

---

## 2. Domain Data Specifications

### A. Vehicles & Plates

- Vehicle Categories: Passenger cars (`B1`-`B5`), Trucks (`C1`, `C2`), Buses (`D1`, `D2`), Trailers (`E`, `F`).
- License Plates (VRM): Ukrainian format (8 characters, e.g., `AA1234BB`, `KA5678CB`). Characters restricted to Cyrillic letters with Latin lookalikes: `A, B, C, E, H, I, K, M, O, P, T, X`.
- VIN Code: 17 characters, excluding letters `I`, `O`, `Q` (e.g., `faker.vehicle.vin()`).

### B. Personal Documents

- Passport (Booklet): Series (2 Cyrillic letters, e.g., `АА`) + 6 digits (`123456`).
- ID Card: 9 digits (`123456789`).
- Driver's License: 3 Cyrillic letters (`ВВВ`) + 6 digits (`123456`).

---

## 3. Data Cleanup & Teardown Rule

Any test generating leads in CRM or iBPM must register the lead key for automatic deletion:

```typescript
deletionLeads.push(lead.key); // Format: osago_<leadId>
```

Prohibited: Pushing raw UUIDs or skipping teardown.
