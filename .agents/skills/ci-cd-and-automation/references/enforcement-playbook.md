# Enforcement Playbook

1. Formulate the architectural rule as a verifiable assertion.
2. Select the enforcement mechanism: ESLint -> test -> hook (`.agents/hooks.json`) -> CI script.
3. Add as `warn`, count existing violations: `pnpm lint 2>&1 | grep -c <rule>`.
4. Fix existing violations in a dedicated task/plan, then elevate rule to `error` / blocking.
5. Verify on an intentional test violation that the rule blocks execution.
6. Record entry in `guardrails-catalog.md` and `lessons-learned-registry`.
7. Format repository: `pnpm lint:fix && pnpm format`.
