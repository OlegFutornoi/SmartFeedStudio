---
name: mock-real-parity
description: Enforces 100% behavioral and data parity between local browser mock mode (in-memory / mockDatabaseDriver), local SQLite (Tauri), and real backend API (NestJS + PostgreSQL). Use when implementing or testing data hydration, catalog operations, supplier feeds, deletion cascades, and quota validations across development environments.
---

# ⚖️ Mock vs Real Parity Mastery

## 📌 Mission & Core Invariant

SmartFeed Studio operates across three execution tiers:

1. **Local Browser Mock** (In-memory `mockDatabaseDriver` for rapid UI development in Vite)
2. **Desktop Native SQLite** (Rust SQLCipher in Tauri v2 production build)
3. **Cloud Backend** (NestJS CQRS + PostgreSQL + Prisma)

> [!IMPORTANT]
> **100% Behavioral Parity**: All three tiers **MUST** produce identical data structures, relationships, cascade semantics, error codes, and quota calculations. A feature that works in Mock mode but fails in Real mode is considered broken.

---

## 🛠 Key Parity Dimensions

### 1. Relation Hydration Parity

Never return raw foreign key IDs without hydrated display fields:

- If `supplierId` is present, `supplierName` **MUST** be populated in both mock and real responses.
- If a catalog has feeds, `activeFeedsCount` and `productsCount` must match across all environments.
- Prevent table column names or technical placeholders leaking into UI components.

### 2. Cascade Deletion Parity

When deleting an entity (e.g. a supplier feed or catalog):

- **Mock**: Remove associated products from the mock collection and recalculate quotas.
- **SQLite**: Execute cascade deletes or transactional cleanups.
- **PostgreSQL**: Trigger foreign key `ON DELETE CASCADE` and decrement counters.

### 3. Error Code & Status Parity

When business rules fail (quota exceeded, duplicate SKU, unauthenticated):

- Return identical structured error responses (`statusCode`, `message`, `code: "QUOTA_EXCEEDED"`).
- Ensure client-side UI error handlers and toasts respond identically in dev mock and production.

---

## 🧪 Parity Testing Pattern

When writing automated Playwright tests, assert both data content and business logic invariants:

```typescript
// Assert real data hydration, never table header leakage
await expect(page.getByTestId('supplier-name')).not.toHaveText('Постачальник');
await expect(page.getByTestId('supplier-name')).toHaveText(/Brain Distribution|MMM/);

// Assert cascade deletion invariants
const initialCount = await getProductCount();
await deleteSupplierFeed('Feed-1');
const finalCount = await getProductCount();
expect(finalCount).toBeLessThan(initialCount);
```

---

## ✅ Pre-Completion Checklist

- [ ] Local mock driver (`mockDatabaseDriver`) hydrates the exact same fields as the backend DTO
- [ ] Deleting a parent entity in Mock mode clears child items identically to SQLite / PostgreSQL
- [ ] Business rule validations (quotas, duplicates) trigger in all environments
- [ ] Playwright E2E tests pass identically against both dev server and backend
