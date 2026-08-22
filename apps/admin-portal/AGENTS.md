# 🌐 Antigravity Agent Guide — Admin Portal (`apps/admin-portal`)

## 📌 Purpose

The **Admin Portal** is the centralized management dashboard for SmartFeed Studio, built for managing users, monitoring infrastructure health, managing license tiers (FREE, PRO, ENTERPRISE), and viewing telemetry metrics.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS (with HSL CSS variable design tokens)
- **Component Architecture**: **shadcn/ui** pattern
- **Icons**: `lucide-react`
- **Shared Types**: `@smartfeed/shared`

---

## 📂 Folder Structure

```text
apps/admin-portal/
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind directives & CSS variable tokens (--background, --primary, etc.)
│   │   ├── layout.tsx          # RootLayout with dark theme, Sidebar & Header
│   │   ├── page.tsx            # Dashboard Overview (stats, CQRS health, recent users)
│   │   ├── users/
│   │   │   └── page.tsx        # User Directory & Role management
│   │   └── licenses/
│   │       └── page.tsx        # Subscription Tiers & License Key directory
│   └── components/
│       ├── layout/
│       │   ├── sidebar.tsx     # Navigation sidebar with active state routing
│       │   └── header.tsx      # Top bar with global search, notifications, profile
│       └── ui/                 # Reusable shadcn/ui atomic components
│           ├── card.tsx        # Card, CardHeader, CardTitle, CardContent, cn() helper
│           ├── button.tsx      # Button (default, outline, secondary, destructive, ghost)
│           └── badge.tsx       # Badge (default, secondary, outline, success, warning)
├── next.config.mjs             # Next.js configuration (transpiles @smartfeed/shared)
├── tailwind.config.ts          # Tailwind config with HSL color system
├── tsconfig.json               # Path aliases (@/* -> ./src/*)
└── package.json
```

---

## 🎨 shadcn/ui Best Practices & Guidelines

1. **Atomic Components in `src/components/ui/`**:
   - Always place composable UI primitives in `src/components/ui/`.
   - Use `cn` from `src/components/ui/card.tsx` (or dedicated `src/lib/utils.ts`) to merge classes cleanly.
2. **Design Tokens & Theme Consistency**:
   - Never hardcode arbitrary hex colors when theme classes are available (e.g. use `bg-card text-card-foreground border-border` instead of arbitrary colors).
   - Use semantic badges:
     - `ENTERPRISE` plan -> `variant="default"`
     - `PRO` plan -> `variant="success"`
     - `FREE` plan -> `variant="secondary"`
3. **Icons**:
   - Always import from `lucide-react` for visual consistency.
4. **Shared Types**:
   - Import DTOs, Enums (`Role`, `PlanType`), and response contracts directly from `@smartfeed/shared`.

---

## ⚡ Development & Build Commands

```bash
# Run Admin Portal dev server (Port 3000)
pnpm dev:admin

# Build Admin Portal production bundle
pnpm build:admin

# Run Next.js linting
pnpm --filter @smartfeed/admin-portal lint
```
