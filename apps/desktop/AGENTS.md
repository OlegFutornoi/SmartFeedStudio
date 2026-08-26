# 🖥 Antigravity Agent Guide — Desktop Client (`apps/desktop`)

## 📌 Purpose

The **Desktop Client** is a high-performance native desktop application designed for heavy XML/CSV e-commerce product feed parsing, local image caching, OS Keychain security, and direct S3/MinIO cloud backup.

---

## 🛠 Tech Stack

- **Native Host Engine**: Tauri v2 (Rust 2021)
- **Frontend Framework**: React 18 + Vite + React Router DOM (TypeScript)
- **UI Architecture**: **shadcn/ui** pattern with HSL CSS variables and Light/Dark themes
- **i18n Multi-language**: Dedicated page-based chunked translation engine (`uk` / `en` with dynamic namespace loading)
- **Styling**: Tailwind CSS + Lucide Icons
- **Testing**: Playwright (@playwright/test) E2E suite
- **Security & Storage**:
  - `keyring` crate: Native OS Keychain storage for JWT refresh tokens (macOS Keychain, Windows Credential Manager, Linux Secret Service).
  - `rusqlite` crate with `sqlcipher`: Local SQLite database encrypted with AES-256 for fast catalog caching.
- **Shared Types**: `@smartfeed/shared`

---

## 📂 Folder Structure

```text
apps/desktop/
├── e2e/                       # Playwright E2E Test Suite
│   ├── auth.spec.ts           # Login, registration, i18n, and home page E2E tests
│   ├── password-recovery.spec.ts # Forgot/Reset password flows, validation, i18n, themes
│   ├── navigation.spec.ts     # Dynamic navigation & sidebar tests
│   └── theme.spec.ts          # shadcn/ui Theme palette & Dark/Light mode tests
├── src-tauri/                 # Rust Native Core
│   ├── src/
│   │   ├── main.rs            # Entry point for Tauri binary
│   │   └── lib.rs             # Tauri commands: store_refresh_token, get_refresh_token, etc.
│   ├── Cargo.toml             # Rust dependencies (tauri v2, keyring, rusqlite with sqlcipher)
│   └── tauri.conf.json        # Tauri v2 configuration (window size, permissions, dev URL)
├── src/                       # React / Vite Frontend
│   ├── i18n/                  # Page-based Multilingual Translation Engine
│   │   ├── locales/           # UK / EN JSON translation dictionaries
│   │   │   ├── uk/            # common.json, auth.json, home.json, errors.json
│   │   │   └── en/            # common.json, auth.json, home.json, errors.json
│   │   ├── types.ts           # Language & Namespace type definitions
│   │   └── index.tsx          # I18nProvider & useTranslation hook with lazy loading
│   ├── components/
│   │   ├── ui/                # Reusable shadcn/ui components (button, input, label, card, alert, badge, theme-toggle, language-toggle)
│   │   ├── login-form.tsx     # Official shadcn login-01 block component
│   │   ├── signup-form.tsx    # Official shadcn signup-01 block component
│   │   ├── forgot-password-form.tsx # Forgot password reset request form
│   │   ├── reset-password-form.tsx  # New password setup form with token validation
│   │   └── PrivateRoute.tsx   # Protected route guard
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Auth state & token persistence
│   │   └── ThemeContext.tsx   # Light / Dark / System theme management
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx          # /auth/login (login-01, i18n, theme-toggle, data-testid)
│   │   │   ├── RegisterPage.tsx       # /auth/register (signup-01, i18n, theme-toggle, data-testid)
│   │   │   ├── ForgotPasswordPage.tsx # /auth/forgot-password (request reset, i18n, theme-toggle)
│   │   │   └── ResetPasswordPage.tsx  # /auth/reset-password (set new password, token verification)
│   │   └── HomePage.tsx       # / (Protected home page: greeting, meetings counter, top 3 meetings, logout)
│   ├── lib/
│   │   ├── api.ts             # REST client for backend auth & password recovery endpoints
│   │   └── utils.ts           # cn() styling utility
│   ├── services/
│   │   ├── keychain.ts        # OS Keychain invoke wrapper (falls back gracefully in browser dev)
│   │   ├── storage.ts         # Direct S3 Presigned URL uploader with progress tracking
│   │   └── sqlite.ts          # Local SQLite / cache database interface
│   ├── App.tsx                # Route definitions (/auth/login, /auth/register, /auth/forgot-password, /auth/reset-password, /)
│   ├── main.tsx               # BrowserRouter + I18nProvider + ThemeProvider + AuthProvider
│   ├── index.css              # Light & Dark theme HSL CSS variables (Zinc palette)
│   └── vite-env.d.ts          # Vite client types
├── playwright.config.ts       # Playwright E2E configuration
├── tailwind.config.ts         # Tailwind CSS tokens
├── postcss.config.js          # PostCSS config
├── vite.config.ts             # Vite config (Port 1420)
├── tsconfig.json              # TypeScript configuration with @/* path aliases
└── package.json
```

---

## 🧪 Testing Policy & Coverage (Playwright)

### 📊 E2E Test Coverage

```bash
# Run desktop Playwright E2E tests (Headless)
pnpm --filter @smartfeed/desktop test:e2e

# Run desktop Playwright E2E tests in visible browser window (Headed)
pnpm --filter @smartfeed/desktop test:e2e:headed

# Run Playwright Interactive UI Mode (Inspector, Time-travel, Traces)
pnpm --filter @smartfeed/desktop test:e2e:ui
```

| Test File                       | Scenarios Covered                                                                                                                                           | Tests | Status  |
| :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :---: | :-----: |
| `e2e/auth.spec.ts`              | Route protection, localized 401 error alert (`UA` / `EN`), successful login redirect, registration flow, multilingual switching (`UA` / `EN`), theme toggle |   6   | ✅ PASS |
| `e2e/password-recovery.spec.ts` | Forgot password navigation, reset request validation, token generation, short password & mismatch checks, credential rotation, login, i18n & theme toggles  |   7   | ✅ PASS |
| `e2e/navigation.spec.ts`        | Dynamic sidebar navigation, RBAC item filtering, collapse/expand states, active route indicator                                                             |   2   | ✅ PASS |
| `e2e/theme.spec.ts`             | shadcn theme palettes (Zinc, Slate, Stone, Bronze), Dark/Light/Dark switching, persistence                                                                  |   3   | ✅ PASS |

**Total: 18 tests — 18 passing**

---

## 🌐 Mandatory 100% i18n & UI Localization Testing Policy

1. **Zero Hardcoded Strings & Zero Untranslated Backend Errors**:
   - Whenever any new UI component, page, form, label, button, placeholder, or alert is created or modified, all user-facing strings **MUST** be defined in both `src/i18n/locales/uk/` and `src/i18n/locales/en/`.
   - All backend errors must be mapped and translated via `getErrorMessage` to prevent raw English strings from appearing in the Ukrainian UI.
2. **Mandatory UI Localization Tests**:
   - Every frontend test suite (`*.spec.ts`) **MUST** explicitly verify dynamic bilingual translations (`UA` ⇄ `EN`) for all interactive elements, forms, and validation alerts.

---

## ⚡ Development & Build Commands

```bash
# Run Playwright E2E tests (Headless)
pnpm --filter @smartfeed/desktop test:e2e

# Run Playwright in visible browser (Headed)
pnpm --filter @smartfeed/desktop test:e2e:headed

# Run Playwright UI Mode
pnpm --filter @smartfeed/desktop test:e2e:ui

# Run Vite dev server in browser (Port 1420)
pnpm dev:desktop

# Run native Tauri v2 desktop application in dev mode (requires Rust)
pnpm --filter @smartfeed/desktop tauri:dev

# Build Vite web assets
pnpm build:desktop

# Build final native executable / installer (.dmg, .app, .msi, .exe)
pnpm --filter @smartfeed/desktop tauri:build
```
