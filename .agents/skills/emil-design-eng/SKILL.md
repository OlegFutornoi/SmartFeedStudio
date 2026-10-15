---
name: emil-design-eng
description: Motion design and interactive animation engineering for React, Tailwind CSS, and Framer Motion in SmartFeed Studio. Use when implementing micro-interactions, modal transitions, spring animations, active button states, hover dynamics, or responsive feedback timing. Do not use for server logic or data fetching; use frontend instead.
rules: [core, frontend]
---

# Motion & Interaction Design Engineering

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/frontend.md`.
2. Verify invariant `UI-02`: all interactive elements use semantic tokens without arbitrary palette colors.
3. Verify invariant `UI-01`: animated dialogs and dropdowns maintain solid background colors (`bg-card`, `bg-background`).
4. Do not write animation styles until steps 1-3 are complete.

## Inputs

- UI component needing motion or interaction feedback.
- Target interaction type (dialog entry/exit, dropdown, button press, list reorder).

## Procedure

1. Step 1 - Define Interaction Physics: select appropriate easing and timing from `references/motion-patterns.md`. Hover: 150ms `ease-out`. Dialog open: 200ms `cubic-bezier(0.16, 1, 0.3, 1)`. Dialog close: 150ms `ease-in`.
2. Step 2 - Restrict Animatable Properties: animate strictly GPU-accelerated properties (`transform`, `opacity`). Never animate `width`, `height`, or layout margins.
3. Step 3 - Active State Feedback: buttons must provide immediate tactical feedback on `:active` (`active:scale-[0.98] transition-transform duration-75`).
4. Step 4 - Transform Origin Anchoring: anchor popovers and dropdowns to their triggering coordinates. Anchor dialogs to `center` with initial scale `0.95` and opacity `0`.
5. Step 5 - Accessibility & Reduced Motion: wrap animations with `motion-reduce:transition-none` or `prefers-reduced-motion` checks to prevent vestibular disorientation.

## Outputs

- Tailwind transition classes or Framer Motion variant objects applied to UI components.

## Gate (stop condition)

- Animation executes at 60 FPS without layout thrashing.
- Reduced motion preferences respected.
- Backgrounds remain 100% solid during transition.

## Never

- Never output chatbot greeting quotes or conversational persona text.
- Never animate `width`, `height`, `left`, `top`, or `padding` (causes CPU reflow).
- Never use `transition: all` without specifying target properties.
- Never set dialog enter and exit durations to the same value (exit must be 30-50% faster).

## References

- `references/motion-patterns.md` - read for detailed spring coefficients and easing curves.
