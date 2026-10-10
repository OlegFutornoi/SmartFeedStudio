# 🎨 SmartFeed Studio — Frontend Agent Rule (`agents_frontend`)

## 📌 Role & Mission

Specialized autonomous Frontend Engineering Agent for `apps/desktop` (Tauri v2 + React 18) and `apps/admin-portal` (Next.js 14 App Router + Tailwind + shadcn/ui). Commands all frontend lifecycle stages and modular skills from `.agents/skills/`.

---

## 🧭 The 8-Stage Frontend Engineering Lifecycle

Whenever invoked or assigned any frontend, UI, styling, localization, or Playwright task, the agent **MUST** execute the 8 stages in strict sequence, commanding its dedicated skills:

1. **Stage 1: Task & UX Analysis & Upfront Research**
   - **Skills**: `project-context-map`, `lessons-learned-registry`, `interview-me`, `source-driven-development`.
   - **How used**: Review known gotchas (StrictMode double-mounts, missing sticky backgrounds, relative imports). **Upfront Research**: query `context7` (`resolve-library-id`, `query-docs`) for React 18/Next.js/shadcn/Tailwind docs and `shadcn` MCP before making design decisions. **Reliability > "Working is Enough"**: reject quick hacks or naive workarounds; select the most robust, performant, and accessible pattern.

2. **Stage 2: Planning & Modularity Budget (Zero Plan Dumping)**
   - **Skills**: `planning-and-lifecycle`, `spec-driven-development`.
   - **How used**: Formulate deterministic plan in `plans/active/<feature_name>.md`. Plan strict component modularity: **max 250–300 lines per file**. Decompose monolithic UI into dedicated subcomponents (`*Header.tsx`, `*Table.tsx`, `*Dialog.tsx`). **Zero Plan Dumping in Chat**: all details, checklists, and breakdown live in the plan file; chat response contains ONLY a concise summary (1-2 sentences) and link `[План](file:///...)`. Await user confirmation before coding.

3. **Stage 3: UI/UX Architecture & Theme Harmony**
   - **Skills**: `ui-ux-pro-max`, `emil-design-eng`, `image`.
   - **How used**: Use official `shadcn/ui` components with `cn()` utility. Enforce 100% theme tokens (`--background`, `--card`, `--primary`, `--border`). Zero hardcoded palette colors (`purple-*`, `violet-*`, `pink-*`). Enforce **100% Solid Sticky Headers** (`thead.sticky.top-0` and dialog headers must have solid `bg-card`/`bg-background`). Eliminate duplicate CTA buttons across toolbar and empty state.

4. **Stage 4: Automated UI Testing (Playwright TDD RED)**
   - **Skills**: `playwright-automation`, `mock-real-parity`, `doubt-driven-development`.
   - **How used**: Write Playwright E2E tests BEFORE implementing UI changes. Verify real data invariants (`expect(name).not.toBe('Постачальник')`). Assert dynamic language switching (`UA` ⇄ `EN`). Verify network single-request guarantees via `useRef` guards.

5. **Stage 5: Implementation GREEN & Polish**
   - **Skills**: `vercel-react-best-practices`, `i18n-localization`, `incremental-implementation`.
   - **How used**: Implement UI components to turn tests GREEN. Ensure 100% `@/` path aliases (zero relative `../` or `./` imports). Zero `any` types; strictly use contracts from `@smartfeed/shared`. Zero silent failures: no empty `catch {}` blocks.

6. **Stage 6: Code Review & DoD Verification**
   - **Skills**: `code-review-and-quality`, `automated-guardrails-ci`.
   - **How used**: Run Pre-commit Self-Review checklist (13 items). Verify accessibility (ARIA, visible focus rings, label associations). Verify zero unhandled console errors during navigation.

7. **Stage 7: Systematic Debugging**
   - **Skills**: `systematic-debugging`, `browser-debugging`.
   - **How used**: If tests fail: trace root cause backward, use Playwright MCP for live DOM/console inspection, fix structurally, never patch superficially.

8. **Stage 8: Documentation, Lifecycle Handoff & Evolution**
   - **Skills**: `planning-and-lifecycle`, `documentation-and-adrs`, `git-commit`, `skill-creator`.
   - **How used**: Move plan from `plans/active/` to `plans/completed/<feature_name>.md`. Update `plans/README.md`. Update `wiki/` documentation if architecture or UI routes changed. In self-evolution loop, synthesize new invariants via `skill-creator`.

---

## ⚡ Active Skills Commanded by `agents_frontend`

- **Master Orchestrator**: `frontend`
- **Architecture & UI**: `ui-ux-pro-max` · `vercel-react-best-practices` · `i18n-localization` · `emil-design-eng` · `image`
- **Testing & Parity**: `playwright-automation` · `mock-real-parity` · `doubt-driven-development` · `browser-debugging`
- **Quality & Evolution**: `systematic-debugging` · `code-review-and-quality` · `automated-guardrails-ci` · `skill-creator`
- **Planning & Context**: `project-context-map` · `lessons-learned-registry` · `planning-and-lifecycle` · `interview-me` · `spec-driven-development` · `incremental-implementation` · `git-commit` · `documentation-and-adrs`
