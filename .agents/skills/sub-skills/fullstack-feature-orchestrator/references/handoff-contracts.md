# 🤝 Phase Handoff Contracts & Artifacts

Standardized contracts and checklist artifacts passed between the 5 development phases.

---

## 1. Phase 1 → Phase 2 Handoff (Contracts to Backend)

Before writing any backend service or controller, the developer must verify:

```text
[ ] Zod schemas and TypeScript DTOs defined in packages/shared/src/
[ ] Enums and error codes added to shared dictionary
[ ] pnpm --filter @smartfeed/shared build passes with 0 errors
[ ] No inline types or 'any' in contracts
```

### Artifact Example

```typescript
// packages/shared/src/dto/feed.dto.ts
export interface FeedDetailDto {
  id: string;
  name: string;
  sourceUrl: string;
  format: FeedFormat;
  status: FeedStatus;
  productCount: number;
  lastSyncedAt: string | null;
  createdAt: string;
}
```

---

## 2. Phase 2 → Phase 3 Handoff (Backend to Frontend)

Before implementing the frontend client, the backend developer must provide:

```text
[ ] Working API endpoint documented in Swagger (http://localhost:4000/api/docs)
[ ] 4-layer validation active (DTO, Quota, Guard, DB)
[ ] PostgreSQL migration applied with @@map and @@index on FKs
[ ] Jest E2E test passing with cleanDatabase teardown
[ ] Standardized error response contract matching shared exception filters
```

---

## 3. Phase 3 → Phase 4 Handoff (Frontend to Parity)

Before running parity checks, the frontend implementation must satisfy:

```text
[ ] Component size budget: all files < 250-300 lines
[ ] Zero duplicate network requests (useRef tracking)
[ ] Solid sticky headers on tables and dialogs
[ ] 100% localized in both locales/uk/*.json and locales/en/*.json
[ ] API client uses shared DTO types
```

---

## 4. Phase 4 → Phase 5 Handoff (Parity to Review)

Before dispatching adversarial review, the parity verification must confirm:

```text
[ ] Mock / SQLite driver returns identical hydrated fields as Real NestJS API
[ ] Cascade deletion test proves 0 orphaned records upon entity removal
[ ] Counter increments and decrements reflect actual record counts
[ ] No column technical names leaked into UI
```

---

## 5. Phase 5 Completion Gate (Definition of Done)

The feature is only ready for user presentation when:

```text
[ ] tsc --noEmit passes in all monorepo packages (0 errors)
[ ] All internal imports use @/ or @smartfeed/shared (0 relative imports ../)
[ ] Zero silent catch {} blocks (all errors logged or translated)
[ ] E2E and unit test suites pass completely
[ ] Documentation / WIKI updated to reflect new endpoints and models
```
