# Lessons Learned Record Template

Format:

- `L-NNN` | Verifiable invariant statement | Target layer/file | Test, lint rule, or CI check

Procedure:

1. Search `registry.md` and `.agents/rules/` to ensure invariant does not already exist.
2. Append new item with sequential identifier (`L-NNN`).
3. Create or update automated verification (RED test, ESLint rule, or guardrail check).
4. If failure class is broad, codify permanent invariant into `.agents/rules/*.md` (<12,000 chars) or skill reference.
5. Record notification in commit/summary.
