# 📦 Antigravity Agent Guide — Shared Package (`packages/shared`)

## 📌 Purpose

The **`@smartfeed/shared`** package is the single source of truth for shared TypeScript types, Zod DTO validation schemas, CQRS Command/Query contracts, Enums, and system constants used across both frontend apps (`admin-portal`, `desktop`) and backend services (`backend-api`).

---

## 🛠 Tech Stack

- **Language**: TypeScript 5.7
- **Validation**: Zod 3.24
- **Module Format**: Dual ESM (`.mjs` / `dist/index.js`) + `.d.ts` declaration maps

---

## 📂 Folder Structure

```text
packages/shared/
├── src/
│   ├── enums/
│   │   └── index.ts            # Role (SUPER_ADMIN, ADMIN, USER), PlanType (FREE, PRO, ENTERPRISE)
│   ├── dtos/
│   │   ├── auth.dto.ts         # RegisterDto, LoginDto, RefreshTokenDto, UserProfile, AuthResponseDto
│   │   ├── license.dto.ts      # LicenseDto, UpgradeLicenseDto, PlanLimits
│   │   └── storage.dto.ts      # PresignedUrlRequestDto, PresignedUrlResponseDto
│   ├── contracts/
│   │   └── cqrs.ts             # Command, Query, and Event interfaces & payloads
│   ├── constants/
│   │   └── index.ts            # PLAN_LIMITS_MAP, S3_FOLDERS
│   └── index.ts                # Main export barrel
├── tsconfig.json
└── package.json
```

## 📝 Documentation Synchronization

- Whenever shared contracts, DTOs, Enums, or constants are added or modified, ensure all referencing package `AGENTS.md` files and root documentation ([README.md](file:///Users/oleg/AQA/SmartFeedStudio/README.md), [AGENTS.md](file:///Users/oleg/AQA/SmartFeedStudio/AGENTS.md), [.agents/rules/rules.md](file:///Users/oleg/AQA/SmartFeedStudio/.agents/rules/rules.md)) reflect these changes.

---

## ⚡ Key Commands

```bash
# Build shared TypeScript declarations and JavaScript bundle
pnpm build:shared

# Watch mode for automatic re-compilation during development
pnpm --filter @smartfeed/shared dev
```
