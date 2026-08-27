# 🎨 Claude Guidelines — Desktop Client (`apps/desktop`)

## 📌 Core Mission & Design Standards

The **Desktop Client** is the flagship application of **SmartFeed Studio**, built on **Tauri v2**, **React 18**, **Vite**, **Tailwind CSS**, and **shadcn/ui**. It provides catalog parsing, AI enrichment, offline caching, and team workspace management.

---

## 🚨 MANDATORY RULE: Visual Testing & `ui-ux-pro-max` Standards Before Task Completion

> **CRITICAL RULE**: Whenever ANY change to the frontend UI is made (components, views, dialogs, sidebars, tables, invite flows, plan blockers, cards, or theme pickers), the agent **MUST ALWAYS**:
>
> 1. **Visually Test & Inspect the Changes**: Verify directly in the browser or via automated visual/Playwright execution that the interface renders flawlessly across themes (Dark/Light) and screen resolutions.
> 2. **Check 100% Compliance with `ui-ux-pro-max` Skill Guidelines**: Validate all design and interaction criteria listed below.
> 3. **Definition of Done**: A UI task **CANNOT and MUST NOT be marked as finished or completed** until both visual inspection and the full `ui-ux-pro-max` verification checklist pass completely.

---

## 🎨 Mandatory `ui-ux-pro-max` Frontend Quality Checklist

Every frontend UI modification must satisfy these design and engineering standards:

### 1. Visual Hierarchy & Typography

- **Modern Typography Scale**: Clear typography hierarchy (Inter font family), crisp tracking, readable font sizes (11–12px captions, 13–14px body, 18–24px headers).
- **High-Contrast Dark Mode & Themes**: Monochrome Zinc base by default, with dynamic support for Slate, Stone, Bronze, Light, and Dark modes.
- **Glassmorphism & Surface Elevation**: High-contrast cards with subtle borders (`border-border/60`), muted card backgrounds (`bg-card/70 backdrop-blur-sm`).

### 2. Micro-Interactions & State Polish

- **Interactive Feedback**: Smooth transitions (`transition-all duration-200`), scale effects on hover, clear active sidebar and tab indicators.
- **Loading & Empty States**: Polished skeleton loaders during asynchronous data fetching; informative empty states with actionable buttons.
- **In-Flight Action Guarding (`useRef`)**: Buttons disabled with loading spinner during server requests to prevent duplicate submissions.

### 3. Component Size & Modularity

- **Strict Component Size Limit**: Max ~250–300 lines per component. Complex views must be decomposed into dedicated subcomponents (`*Dialog.tsx`, `*List.tsx`, `*Row.tsx`, `*Header.tsx`).
- **Zero Dead Code**: Eliminate all unreferenced imports, variables, and unreachable code immediately.

### 4. 100% Internationalization (i18n) & Zero Layout Breakages

- **Bilingual Parity**: All labels, placeholders, tooltips, dialog titles, toasts, and table headers translated in both `uk` and `en` (`locales/uk/*.json`, `locales/en/*.json`).
- **No Text Clipping**: Verify that longer Ukrainian / English text strings do not wrap awkwardly or break flex layouts.

### 5. Accessibility & Defensive UX

- **ARIA & Keyboard Navigation**: Proper `role`, `aria-label`, and keyboard focus rings (`focus-visible:ring-2`).
- **Modal Dialog Confirmations**: Destructive actions (e.g. deleting members, revoking invites) must always require confirmation dialogs with clear warning context.

---

## 🧪 Verification Protocol

Before reporting task completion:

1. **Visual Testing**: Run/verify UI in browser or Playwright headed/e2e mode (`pnpm test:desktop`).
2. **Typecheck Clean**: `pnpm --filter @smartfeed/desktop exec tsc --noEmit` must pass with **0 errors**.
3. **Format**: `pnpm format` executed.
