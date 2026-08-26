---
trigger: always_on
description: 'Rules for continuous WIKI and knowledge base maintenance and synchronization'
---

# 📚 SmartFeed Studio — Continuous WIKI & Knowledge Base Policy

## 📌 10. Mandatory WIKI & Knowledge Base Synchronization

- **Central Knowledge Base Location**: All architecture, domain knowledge, schema documentation, UI flows, and FAQ guides reside in the root `wiki/` directory.
- **Mandatory WIKI Updates**:
  Whenever any of the following events occur:
  1. **New or Modified Feature**: Adding or updating any UI page, component, endpoint, CQRS command/query/event, or service.
  2. **Database Schema Changes (`schema.prisma`)**: Adding or modifying any model, relation, field, enum, or migration logic. Must be documented in `wiki/03-database-schema/`.
  3. **New Test Suite or Coverage Change**: Every new or updated test suite must be updated in `wiki/07-testing-and-qa/test-coverage-matrix.md`.
  4. **Tariffs & Pricing Changes**: Adjustments to plan pricing, quotas, duration policies (`durationDays`), or access guards must be reflected in `wiki/03-database-schema/dynamic-durations-policy.md`, `wiki/04-backend-cqrs/licenses-and-plans.md`, and `wiki/08-user-faq/plans-and-pricing-faq.md`.
  5. **UI & User Experience Evolutions**: Any changes to user workflows must be reflected in `wiki/05-desktop-client/`, `wiki/06-admin-portal/`, and `wiki/08-user-faq/user-guide-faq.md`.
- **WIKI Structure Integrity**:
  - Keep `wiki/README.md` (Table of Contents) strictly synchronized with all files and subdirectories.
  - Use GitHub markdown alerts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`), clear tables, and Mermaid diagrams for architectural readability.
  - Never allow WIKI documentation to become stale or drift from actual code implementations.
