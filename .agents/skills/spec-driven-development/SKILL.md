---
name: spec-driven-development
description: Specification creation and capability mapping before code execution. Absorbed into planning-and-lifecycle. Use when drafting requirements or decomposing complex initiatives into modules.
rules:
  - core
  - docs_and_ops
---

# Spec-Driven Development

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Load skill `planning-and-lifecycle`.
3. Do not draft isolated specifications without anchoring them in `plans/active/`.

## Specification guidelines

1. Surface assumptions early: Explicitly list all technical assumptions (browser targets, database engines, authentication strategies) before drafting implementation steps.
2. Capability mapping: When a feature request bundles multiple distinct domain capabilities (e.g., authentication, billing, feed ingestion), decompose them into modular sub-plans with explicit dependency order.
3. Write plan directly to file: Document specifications in `plans/active/<feature>.md` following the mandatory structure defined in `planning-and-lifecycle`.
4. Chat brevity: Provide a 1-2 sentence summary in chat with a link to the active plan file. Await user confirmation before writing code.
