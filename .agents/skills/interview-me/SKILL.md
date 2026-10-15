---
name: interview-me
description: Clarifies underspecified requirements through structured, single-question inquiries with attached hypotheses until target confidence (95%) is achieved. Use when user requests lack clear constraints, users, or success metrics.
rules:
  - core
  - docs_and_ops
---

# Interview Me

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Review known requirements gaps before engaging in dialogue.
3. Do not prompt in automated non-interactive runs (CI, scheduled tasks).
4. Do not start coding while requirements remain ambiguous.

## Single-question interview protocol

1. Initial hypothesis and confidence score: State current interpretation of the user requirement in one sentence with an explicit confidence estimate (0% to 100%).
2. One question at a time: Ask exactly one focused question per turn. Never send bulleted batches of questions.
3. Attach best hypothesis: Accompany the question with your recommended answer or technical guess (`GUESS: ...`) to allow rapid user confirmation or correction.
4. Distinguish actual need from convention: When users cite generic conventions ("make it scalable", "standard approach"), request concrete metrics, user roles, and constraints.
5. Synthesize and confirm: Once confidence reaches >=95%, summarize the agreed objective in 3-5 bullet points using user domain terminology. Transition immediately to `planning-and-lifecycle`.
