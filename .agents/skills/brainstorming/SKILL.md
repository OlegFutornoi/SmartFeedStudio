---
name: brainstorming
description: 'You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new.'
rules:
  - core
  - docs_and_ops
---

# Brainstorming

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md` and `.agents/rules/docs_and_ops.md`.
2. Do not write feature or product code during brainstorming. All architectural designs belong in `plans/active/<feature>.md` (per PLAN-01).
3. Chat responses must stay concise (1-2 questions at a time per `interview-me` and `CORE-07`).
4. Avoid markdown tables in instructions to conserve prompt budget.

## Core Purpose

Find out what the user actually wants and why before anything gets built. Good questions uncover unstated assumptions, enabling high-precision design decisions.

## Assessment

Ask yourself: what do I know about what they want, and why?

- Simple task with full clarity ("make the badge emerald"): Execute directly.
- Non-trivial intent or missing constraints: Begin discovery inquiry.

## Discovery Protocol

1. Offer opt-out in message one: state that the user can skip questions if they prefer immediate execution.
2. One question per turn: ask exactly one open, concrete question without a multiple-choice list.
3. Plain language: match the user's domain terminology.
4. Topics to explore sequentially:
   - What makes this feature special and why it matters now.
   - Goals, non-goals, and anti-goals (what constitutes failure even if technically working).
   - Prior art: existing tools or patterns they like or dislike.
   - Current state: what has already been built or tried.
5. Offer exploration: propose inspecting existing repo code or external docs when helpful.
6. Playback: summarize agreed understanding in 2-3 bullet points before advancing.

## Work Sizing

Categorize the work scope into one of three tiers:

- Quick, clear task: execute through standard single-step workflow.
- Small change: draft short implementation notes in chat and execute.
- Multi-step project: write full design specification and hand off to `writing-plans`.

## Hard Gate

Nothing gets built until the user confirms the written description or plan. Building includes writing product code, scaffolding, or altering schemas. Transition to `writing-plans` once requirements are approved.

## Red Flags

- Offering leading multiple-choice options before asking open questions.
- Silently filling in defaults without stating them aloud.
- Assuming verbal approval of an idea equals approval of an unwritten spec.
- Continuing to build on top of throwaway prototype spikes without re-entering the planning gate.
