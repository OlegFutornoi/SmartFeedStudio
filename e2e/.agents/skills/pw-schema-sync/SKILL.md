---
name: pw-schema-sync
description: Synchronize, extract, compile, and validate API JSON schemas (Draft-07 / AJV) and generate strong TypeScript types from Swagger/OpenAPI specifications. Use whenever the user asks to update API schemas, sync schemas, re-extract schemas from Swagger, compile Draft-07 schemas, run schema-to-types generation, or invoke the schema sync agent.
---

# API Schema & Type Synchronizer (`pw-schema-sync`)

Automated contract synchronization pipeline connecting backend Swagger/OpenAPI specifications, AJV JSON Schemas (Draft-07), and TypeScript interfaces.

---

## 1. Quick Execution Commands

- **Universal Multi-Product & Multi-Environment Sync (Master CLI):**

  ```bash
  # Product Manager з оточення stage3 (з урахуванням extended=true та МТСБУ)
  node tools/sync-schemas.cjs --product=pm --env=stage3

  # IBPM (Insurance BPM) з review2
  node tools/sync-schemas.cjs --product=ibpm --env=review2

  # OTP Service зі stage
  node tools/sync-schemas.cjs --product=otp --env=stage

  # Синхронізація всіх продуктів
  node tools/sync-schemas.cjs --product=all --env=stage
  ```

- **Legacy IBPM Sync:**

  ```bash
  node .agents/skills/pw-schema-sync/scripts/sync-schemas.cjs [--download]
  ```

- **Generate TypeScript Interfaces from Schemas (SSOT):**
  ```bash
  npm run schemas:types
  ```

---

## 2. Synchronization Pipeline

1. **Download Specification (`tools/download-spec.cjs`):** Завантажує специфікацію Swagger/OpenAPI або Nelmio ApiDoc для вибраного `--product` та `--env` у `tests/api/docs/{product}-{env}-spec.json`.
2. **Extract & Sanitize (`tools/extract-schemas.cjs` / `tools/sync-schemas.cjs`):** Конвертує OpenAPI 3.0 / Nelmio в Draft-07 схеми, розкриває `$ref`, транслює `nullable: true` у `["type", "null"]`, враховує `extended=true` та вкладені структури.
3. **AJV Compilation & Validation:** Перевіряє валідність згенерованих схем через AJV Draft-07 компілятор.
4. **TypeScript Type Generation:** Оновлює DTO інтерфейси у `api/{product}/models/`.
5. **Quality Gate:** Запускає `npx tsc --noEmit && npm run lint` для перевірки цілісності типів та кодової бази.
