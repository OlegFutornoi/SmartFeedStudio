# 🌐 Antigravity Agent Guide — Admin Portal (`apps/admin-portal`)

## 📌 Purpose

The **Admin Portal** is the centralized management dashboard for SmartFeed Studio, built for managing users, monitoring infrastructure health, managing license tiers (FREE, PRO, ENTERPRISE), and changing administrator credentials.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router with Route Groups)
- **UI Library**: React 18
- **Styling**: Tailwind CSS (with HSL CSS variable design tokens)
- **Component Architecture**: **shadcn/ui** pattern (`dashboard-01`, `sidebar-07`)
- **Icons**: `lucide-react`
- **Shared Types**: `@smartfeed/shared`

---

## 📂 Folder Structure

```text
apps/admin-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx        # Protected Admin Login (no public register)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # AuthGuard + Sidebar (sidebar-07) + Header
│   │   │   ├── page.tsx            # Dashboard Overview (dashboard-01 style, Total Users metric)
│   │   │   ├── users/
│   │   │   │   └── page.tsx        # Users Directory & Live Search/Filtering
│   │   │   ├── plans/
│   │   │   │   └── page.tsx        # Dedicated Tariff Plans CRUD, Pricing & Quotas
│   │   │   ├── licenses/
│   │   │   │   └── page.tsx        # Customer Issued Licenses registry table
│   │   │   ├── navigation/
│   │   │   │   └── page.tsx        # Dynamic navigation items & live permission simulator
│   │   │   └── settings/
│   │   │       ├── page.tsx        # Admin Profile & Password Change Form
│   │   │       ├── payments/
│   │   │       │   └── page.tsx    # Payment Gateways integration
│   │   │       └── ai/
│   │   │           └── page.tsx    # AI Provider configuration
│   │   ├── globals.css             # Tailwind directives & CSS variable tokens
│   │   └── layout.tsx              # Root layout with AuthProvider & dark theme
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthGuard.tsx       # Route protection & loading state
│   │   ├── layout/
│   │   │   ├── sidebar.tsx         # Collapsible sidebar (sidebar-07) + User footer menu
│   │   │   └── header.tsx          # System status header
│   │   ├── profile/
│   │   │   └── change-password-dialog.tsx # Password update modal dialog
│   │   └── ui/                     # shadcn/ui primitives
│   │       ├── avatar.tsx          # User avatars & initials
│   │       ├── badge.tsx           # Status & tier badges
│   │       ├── button.tsx          # Buttons (default, outline, ghost, etc.)
│   │       ├── card.tsx            # Card, Header, Title, Description, Content, Footer
│   │       ├── dialog.tsx          # Modal dialog primitive
│   │       ├── input.tsx           # Form text & password inputs
│   │       ├── label.tsx           # Form labels
│   │       ├── separator.tsx       # Dividers
│   │       └── table.tsx           # Data tables (Header, Body, Row, Cell)
│   ├── contexts/
│   │   └── AuthContext.tsx         # Session state, login, logout, changePassword
│   └── lib/
│       ├── api.ts                  # REST client with JWT Bearer auto-injection
│       └── utils.ts                # cn() class merger
├── next.config.mjs                 # Next.js configuration (transpiles @smartfeed/shared)
├── tailwind.config.ts              # Tailwind config with HSL color system
├── tsconfig.json                   # Path aliases (@/* -> ./src/*)
└── package.json
```

---

## 🎨 shadcn/ui Best Practices & Guidelines

1. **Atomic Components in `src/components/ui/`**:
   - Always place composable UI primitives in `src/components/ui/`.
   - Use `cn` from `src/lib/utils.ts` to merge classes cleanly.
2. **Design Tokens & Theme Consistency**:
   - Use semantic badges:
     - `ENTERPRISE` plan -> `variant="outline"` with amber accent
     - `PRO` plan -> `variant="outline"` with emerald accent
     - `FREE` plan -> `variant="secondary"`
3. **Icons**:
   - Always import from `lucide-react` for visual consistency.
4. **Shared Types**:
   - Import DTOs, Enums (`Role`, `PlanType`), and response contracts directly from `@smartfeed/shared`.
5. **Documentation Synchronization**:
   - When introducing new routes, layout patterns, UI modules, or shared dependencies, keep this [AGENTS.md](AGENTS.md), root [AGENTS.md](../../AGENTS.md), [.agents/rules/rules.md](../../.agents/rules/rules.md), and root [README.md](../../README.md) synchronized.
6. **Mandatory 100% i18n & UI Localization Testing Policy**:
   - Every user-facing UI feature, form, modal, label, and API error response must be 100% translated into both Ukrainian (`uk`) and English (`en`).
   - Every frontend spec must include explicit tests for dynamic language switching (`UA` ⇄ `EN`).
7. **Mandatory Zero-Duplicate API Calls Policy**:
   - Keep `reactStrictMode: false` in `next.config.mjs`.
   - Never put UI-only state (`isUk`, `theme`) into data-fetching `useCallback` dependency arrays.
   - Run `api-contracts.spec.ts` to assert that endpoints are called strictly 1 time upon page load.

---

## 🧪 Testing Policy & Coverage (Playwright)

```bash
# Run Admin Portal Playwright E2E tests (Headless)
pnpm test:admin

# Run Admin Portal Playwright E2E tests in visible browser (Headed)
pnpm test:admin:headed

# Run Playwright UI Mode
pnpm test:admin:ui
```

| Test File                   | Scenarios Covered                                                                    | Tests | Status  |
| :-------------------------- | :----------------------------------------------------------------------------------- | :---: | :-----: |
| `e2e/auth.spec.ts`          | Login, validation, invalid credentials, USER role rejection, i18n & theme            |   4   | ✅ PASS |
| `e2e/dashboard.spec.ts`     | Widgets, metrics, latest users, language toggle, change password dialog              |   4   | ✅ PASS |
| `e2e/licenses.spec.ts`      | Registry, search, plan/status/S3 filters, reset, empty state                         |   7   | ✅ PASS |
| `e2e/navigation.spec.ts`    | Items list, target app filter, plan simulator, i18n, error translation, menu routing |   7   | ✅ PASS |
| `e2e/plans.spec.ts`         | Plan list, creation dialog, editing, delete confirmation dialog                      |   4   | ✅ PASS |
| `e2e/settings.spec.ts`      | Profile, infra cards, password validation, i18n translations                         |   3   | ✅ PASS |
| `e2e/theme.spec.ts`         | Default Zinc dark theme, palette dropdown (Slate, Stone, Bronze)                     |   2   | ✅ PASS |
| `e2e/users.spec.ts`         | User table, count, search, role filtering, i18n, empty states                        |   5   | ✅ PASS |
| `e2e/api-contracts.spec.ts` | Contract URLs, Zero 404/500 stability, single-request performance tests              |  10   | ✅ PASS |

**Total: 46 tests — 46 passing (100%)**

---

## ⚡ Development & Build Commands

```bash
# Run Admin Portal dev server (Port 3000)
pnpm dev:admin

# Run Playwright E2E tests
pnpm test:admin

# Build Admin Portal production bundle
pnpm build:admin

# Run Next.js linting
pnpm --filter @smartfeed/admin-portal lint
```
