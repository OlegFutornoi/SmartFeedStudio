---
trigger: always_on
description: Continuous WIKI synchronization, knowledge base updates, and test coverage documentation rules.
---

# 📚 SmartFeed Studio — Continuous WIKI & Documentation Policy

## 📌 1. Mandatory Architecture & Documentation Synchronization

Whenever any architectural change occurs (new modules, CQRS commands/queries/events, DB schema changes in `schema.prisma`, shared DTOs/enums in `@smartfeed/shared`, Tauri commands/services, API endpoints, or ports):

- **Always update documentation immediately**:
  1. Central Knowledge Base: [wiki/README.md](../../wiki/README.md) and all relevant sub-articles in `wiki/`
  2. Root [AGENTS.md](../../AGENTS.md) and [.agents/rules/rules.md](rules.md)
  3. Sub-project guides ([services/backend-api/AGENTS.md](../../services/backend-api/AGENTS.md), [apps/admin-portal/AGENTS.md](../../apps/admin-portal/AGENTS.md), [apps/desktop/AGENTS.md](../../apps/desktop/AGENTS.md), [packages/shared/AGENTS.md](../../packages/shared/AGENTS.md))
  4. Root [README.md](../../README.md) (including Mermaid architecture diagrams, folder trees, and CQRS flow steps).
- Outdated or drifting documentation is strictly prohibited.

---

## 📊 2. Mandatory Test Coverage Documentation (`services/backend-api/test/`)

Whenever a new or modified `*.e2e-spec.ts` file appears in `services/backend-api/test/`:

1. **Run the full E2E suite** to confirm all tests pass:
   ```bash
   pnpm --filter @smartfeed/backend-api test:e2e
   ```
2. **Update the coverage table** in [services/backend-api/AGENTS.md](../../services/backend-api/AGENTS.md) under section `🧪 Testing Policy & Coverage`.
3. **Update the coverage table** in [services/backend-api/README.md](../../services/backend-api/README.md) under section `📊 E2E Test Coverage`.

- The `services/backend-api/README.md` must **always begin** with the test run command as its first code block.
- Never let coverage tables drift from actual test files.

---

## 🗂 3. WIKI Structure Integrity & Formatting

- **Central Location**: All architecture, domain knowledge, schema documentation, UI flows, and FAQ guides reside in `wiki/`.
- Keep `wiki/README.md` (Table of Contents) strictly synchronized with all files and subdirectories.
- Use GitHub markdown alerts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`), clear tables, and Mermaid diagrams for architectural readability.
