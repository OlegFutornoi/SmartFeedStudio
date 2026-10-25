---
trigger: always_on
---

# UI Testability Contract & Frontend Standards

Context: Architectural rules established to eliminate test flakiness and maintain deterministic E2E UI automation.

---

## RULE-01: Mandatory `data-testid` on Interactive Elements

- Every clickable element (buttons, dropdowns, filter options, checkboxes, inputs) involved in form/catalog business flows must possess a unique, stable `data-testid` attribute independent of localized UI copy.
- **Naming Convention:** `{entity}-{element-type}-{identifier}` (e.g. `vehicle-type-option-truck`, `filter-toggle-seats-count`).
- **Anti-Pattern:** Never target elements purely by transient attributes like `title`, localized text, or generic ARIA roles when testing multi-language or redesigned components.

## RULE-02: Single Source of Truth for Selectors (No Fallback Chaining)

- When an element has `data-testid`, QA locators must exclusively target that test ID.
- **Prohibited:** Fallback chains like `locator(A).or(locator(B)).or(locator(C))` as standard selectors. They mask UI regressions by silently clicking unrelated fallback elements when markup breaks.
- **Contract:** Modifying or removing a `data-testid` is treated as a breaking API change.

## RULE-03: Explicit State Contracts (No Guessing via `Promise.race`)

- Asynchronous UI branches (e.g., "after submit: show modal OR redirect to catalog") must expose an explicit, deterministic state signal in the DOM (`data-state`, custom event, or synchronous URL parameter).
- **Prohibited:** Relying on `Promise.race` with `.catch(() => "timeout")` across multiple potential outcomes. This hides the actual root cause of failures when neither state resolves properly.
- **Contract:** Frontend components must emit `data-state="submit:modal-shown"` or `data-state="submit:redirect"` before starting navigation/animation.

## RULE-04: Cross-Environment Attribute Parity

- Build and bundling pipelines must NEVER strip `data-testid` or `data-state` attributes in any environment, including production (`PROD`).
- **Reason:** Stripping testability attributes in production while running staging/production monitoring tests introduces false negatives and prevents reliable production verification.
