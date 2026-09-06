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
