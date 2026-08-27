# 🎨 Claude Guidelines — Admin Web Portal (`apps/admin-portal`)

## 📌 Core Mission & Design Standards

The **Admin Web Portal** is the enterprise management center of **SmartFeed Studio**. It must deliver an ultra-premium, modern, editorial, and responsive user experience built on **Next.js 14**, **Tailwind CSS**, and **shadcn/ui**.

---

## 🚨 MANDATORY RULE: Visual Testing & `ui-ux-pro-max` Standards Before Task Completion

> **CRITICAL RULE**: Whenever ANY change to the frontend UI is made (components, layouts, forms, tables, dialogs, badges, color tokens, animations, or typography), the agent **MUST ALWAYS**:
>
> 1. **Visually Test & Inspect the Changes**: Verify directly in the browser or via automated visual/Playwright execution that the interface renders flawlessly, without layout shifts, overlapping text, or broken alignments.
> 2. **Check 100% Compliance with `ui-ux-pro-max` Skill Guidelines**: Validate all design criteria listed below.
> 3. **Definition of Done**: A UI task **CANNOT and MUST NOT be marked as finished or completed** until both visual inspection and the full `ui-ux-pro-max` verification checklist pass completely.

---

## 🎨 Mandatory `ui-ux-pro-max` Frontend Quality Checklist

Every frontend UI modification must satisfy these design and engineering standards:

### 1. Visual Hierarchy & Typography

- **Modern Typography Hierarchy**: Crisp tracking, readable font sizes (11–12px captions, 13–14px body, 18–24px headers), proper leading.
- **High-Contrast Editorial Design**: Cohesive monochromatic Zinc base by default with curated theme accents (Slate, Stone, Bronze). Avoid raw browser defaults or generic flat primary colors.
- **Glassmorphism & Depth**: Subtle borders (`border-border/60`), muted backdrop blurs (`backdrop-blur-sm`), clean card headers and footers.

### 2. Micro-Interactions & State Polish

- **Interactive Feedback**: Smooth transitions (`transition-all duration-200`), scale effects on hover for icons, clear active states (`bg-primary/15 text-primary` or `bg-primary text-primary-foreground`).
- **Loading & Empty States**: Polished skeleton loaders or spinner indicators during async data fetching; descriptive empty states with actionable reset buttons.
- **In-Flight Action Guarding**: Buttons disabled with loading spinner during server requests to prevent duplicate submissions.

### 3. Component Size & Modularity

- **Strict Component Size Limit**: Max ~250–300 lines per component. Complex views must be decomposed into dedicated subcomponents (`*Dialog.tsx`, `*Toolbar.tsx`, `*Row.tsx`, `*Header.tsx`).
- **Zero Dead Code**: Eliminate all unreferenced imports, variables, and unreachable code immediately.

### 4. 100% Internationalization (i18n) & Zero Layout Breakages

- **Bilingual Parity**: All labels, placeholders, tooltips, dialog titles, toasts, and table headers translated in both `uk` and `en` (`locales/uk/*.json`, `locales/en/*.json`).
- **No Text Clipping**: Verify that longer Ukrainian / English text strings do not wrap awkwardly or break flex layouts.

### 5. Accessibility & Defensive UX

- **ARIA & Keyboard Navigation**: Proper `role`, `aria-label`, and keyboard focus rings (`focus-visible:ring-2`).
- **Modal Dialog Confirmations**: Destructive actions (e.g. deleting plans, deleting licenses) must always require confirmation dialogs with clear warning context.

---

## 🧪 Verification Protocol

Before reporting task completion:

1. **Visual Testing**: Run/verify UI in browser or Playwright headed/e2e mode (`pnpm test:admin`).
2. **Typecheck Clean**: `pnpm --filter admin-portal exec tsc --noEmit` must pass with **0 errors**.
3. **Format**: `pnpm format` executed.
