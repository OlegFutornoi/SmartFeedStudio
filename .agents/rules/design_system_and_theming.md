# 🎨 SmartFeed Studio — Design System, Theming & Semantic Colors Policy

## 📌 Core Rule: 100% Theme Harmony & Zero Ad-Hoc / Off-Scheme Colors

The frontend applications (`apps/desktop`, `apps/admin-portal`) feature dynamic theming with user-selectable palettes (**Zinc, Slate, Stone, Gray, Neutral, Bronze**) and **Light / Dark modes**.

To maintain a consistent, enterprise-grade aesthetic, all UI components, buttons, tabs, badges, headers, modals, and interactive mockups **MUST ALWAYS** use semantic design tokens and **MUST NEVER** use ad-hoc, off-scheme Tailwind palette colors.

---

## 🚫 1. Strict Prohibition of Off-Scheme Colors

1. **Never Hardcode Arbitrary Color Palettes**:
   - **STRICTLY FORBIDDEN**: Using arbitrary decorative color classes such as `purple-*`, `violet-*`, `fuchsia-*`, `pink-*`, `cyan-*` outside the defined design system.
   - Using hardcoded colors like `bg-purple-600`, `text-purple-400`, `border-purple-500/30`, `bg-purple-500/10` breaks theme synchronization, clashes with user-selected theme palettes (e.g. Bronze, Zinc), and ruins visual harmony.

2. **Zero Inconsistent Overrides on Standard Components**:
   - Never override standard shadcn/ui component variants (e.g. `Button variant="default"`, `Badge variant="secondary"`) with hardcoded palette classes like `bg-purple-600 text-white`.
   - Let shadcn components naturally consume theme CSS variables (`--primary`, `--primary-foreground`, `--card`, `--muted`, `--border`).

---

## 🎨 2. Mandatory Semantic Theme Tokens

Always use semantic Tailwind tokens that automatically adapt to the user's active theme and light/dark mode:

| UI Purpose                         | Correct Semantic Classes                                 | ❌ Prohibited Ad-Hoc Classes           |
| :--------------------------------- | :------------------------------------------------------- | :------------------------------------- |
| **Primary Buttons / Active Tabs**  | `bg-primary hover:bg-primary/90 text-primary-foreground` | `bg-purple-600 text-white`             |
| **Feature Badges & Chips**         | `bg-primary/10 text-primary border-primary/20`           | `bg-purple-500/10 text-purple-400`     |
| **Icon Backdrops (Subtle)**        | `bg-primary/10 text-primary border border-primary/20`    | `bg-purple-500/10 text-purple-400`     |
| **Feature Card / Section Borders** | `border-border/80 hover:border-primary/40`               | `border-purple-500/30`                 |
| **Highlight Text / Labels**        | `text-primary font-medium`                               | `text-purple-400`, `text-purple-600`   |
| **Interactive Card Containers**    | `bg-card border-border shadow-xs`                        | `border-purple-500/20 bg-purple-500/5` |

---

## 🚦 3. Permitted Functional Status Colors Only

The only non-primary palette colors permitted are strictly functional status indicators:

- **Success / Completed**: `emerald-500` / `green-500` (e.g. checkmarks, active license badge)
- **Warning / Quota Alert**: `amber-500` (e.g. quota 80%+ usage, trial countdown)
- **Destructive / Error**: `destructive` / `red-500` (e.g. delete dialog, error toast)
- **Informational**: `blue-500` (e.g. sync in progress)

Any other decorative styling **MUST** use `primary`, `muted`, `card`, `background`, or `accent` tokens.

---

## 🛡️ 4. Mandatory Pre-Commit Grep Check

Before completing any frontend UI task or review, verify that no off-scheme color classes exist in changed files:

```bash
git diff --name-only | xargs grep -E "purple-|violet-|fuchsia-|pink-"
```

Any match must be structurally replaced with semantic tokens before presenting changes to the user.

---

## 🚫 5. Zero Duplicate Action / CTA Buttons Policy (No Redundant UI Controls)

1. **Strict Prohibition of Duplicate Action Buttons on the Same Screen**:
   - **NEVER** render duplicate Action or CTA buttons with identical functionality simultaneously in the same viewport, page, or modal.
   - Example of violation: Having `[ + Додати постачальника ]` in the top toolbar/header AND `[ Додати постачальника ]` in an empty state card directly below it on the same view.

2. **Empty State vs Header/Toolbar Hierarchy**:
   - When an entity list or collection is empty (`items.length === 0`):
     - The **Empty State Card** is the single, primary Call to Action (CTA) for creating the initial item.
     - Redundant header or toolbar action buttons **must not** be displayed alongside an empty state card that already provides that action.
     - Search bars and filter toolbars **must not** be displayed when `items.length === 0` (searching or filtering an empty dataset is meaningless).
   - Header/toolbar action buttons and search bars activate once items exist (`items.length > 0`) or when clearing/modifying an active search query.
   - Modal footers must **never** duplicate a create/connect action button if the modal body is displaying an empty state card with that exact CTA.

---

## ✂️ 6. Clean Text & URL Display Policy (Zero Raw URLs & Parameter Junk)

1. **Never Expose Raw URLs with Query Parameters**:
   - Long URLs containing query parameters (`?token=...&hash=...`), hashes, or auth credentials **MUST NEVER** be rendered directly in primary UI labels, table columns, cards, or titles.
   - Always sanitize and shorten for human readability: display clean domain/hostname names and file types (e.g. `livolo.in.ua (rozetka.xml)` or `livolo.in.ua`).
   - The full URL with parameters may only exist in the HTML `title` attribute for tooltip/hover inspection or in a dedicated "Copy URL" action.

2. **Strict Quota Enforcement on All Action Triggers**:
   - Whenever a resource quota is reached (e.g. `isFeedLimitReached`, `isSupplierLimitReached`, `isProductLimitReached`):
     - ALL creation buttons (`[ + Підключити фід ]`, `[ + Імпортувати фід ]`) across headers, toolbars, and empty states **MUST** be disabled with a clear, localized tooltip explaining the limit.
     - Multi-step wizards (e.g. `ImportFeedWizardDialog`) **MUST** display an alert banner and disable progression steps ("Далі", "Почати імпорт").
     - Business logic and submit handlers **MUST** reject execution with a localized error message if a quota is exceeded.
