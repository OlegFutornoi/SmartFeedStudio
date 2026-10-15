# Motion & Animation Engineering Patterns Reference

## Core Timing Presets

- Micro-interactions (hover, click, active): 100-150ms `ease-out`.
- Modal/Dialog entry: 200ms `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like ease-out).
- Modal/Dialog exit: 150ms `ease-in` (exit should always be faster than entry).
- Dropdown/Popover: 150ms `cubic-bezier(0.16, 1, 0.3, 1)`.

## Transform Origins

- Popover / DropdownMenu: `transform-origin: var(--radix-popover-content-transform-origin)` or trigger element coordinates.
- Dialog / Modal: `transform-origin: center` with initial scale `0.95` and opacity `0`.
- Drawer: transform along drawer direction (e.g. `translate-x-full` to `translate-x-0`).

## Spring Dynamics (Framer Motion)

```typescript
export const springPresets = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  bouncy: { type: 'spring', stiffness: 300, damping: 20 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
};
```

## CSS Transition Rules

- Only animate `opacity` and `transform`.
- Never animate `width`, `height`, `margin`, `padding`, or `top/left` (forces layout reflows).
- Always include `prefers-reduced-motion` media query or class.
