---
name: ibpm-error
description: Analyze iBPM lead failures, diagnose errors across CRM, EWA, AIWA, Portmone, LiqPay, and OTP flows for any environment (prod, review2, review, stage, intg) by space-separated `<env> <leadUuid>` (e.g. "prod c2f7a592-7918-4b1c-adff-161d2cff0a27") or requestId, and output concise factual evidence-backed reports with exact URLs, HTTP statuses, and log snippets. Use whenever asked to investigate why an IBPM lead failed, analyze lead logs in prod/review2, debug EWA contract/save or payment errors, or explain an insurance lead error without guesswork or unsolicited recommendations.
---

# iBPM Error Analyzer (`ibpm-error`)

Automated log collection, transition failure diagnostics, and factual evidence-based reporting for insurance leads in iBPM.

---

## 1. Input Command Syntax

Invoke with environment and lead UUID separated by space:

```bash
node .agents/skills/ibpm-error/scripts/analyze-lead-error.cjs <env> <leadUuid>
```

Supported environments: `prod`, `review2`, `review1`, `stage`, `intg`.

Examples:

```bash
node .agents/skills/ibpm-error/scripts/analyze-lead-error.cjs prod c2f7a592-7918-4b1c-adff-161d2cff0a27
node .agents/skills/ibpm-error/scripts/analyze-lead-error.cjs review2 1dfd6020-889c-720d-9666-ae866947becf
```

---

## 2. Lead Lifecycle Stage Diagnosis

The script maps failure points across the 6 transition stages:

1. Lead Creation: CRM initial record generation, vehicle and client validation.
2. Draft Creation: EWA contract draft compilation, tax ID and address verification.
3. Offer Calculation: Rate quotation and insurer tariff generation.
4. OTP Verification: Contract transition (`state/REQUEST`, CRM `заявлено`), SMS/Viber code dispatch.
5. Payment Processing: Portmone/LiqPay invoice creation, postback validation, net payment verification.
6. Policy Issuance: Contract state `EMITTED` / `оформлено` and policy document attachment.

---

## 3. Diagnostic Workflow

1. Parse `<env>` and `<leadUuid>`.
2. Collect logs: `analyze-lead-error.cjs` checks local logs or fetches them via `open-agent.cjs`.
3. Check 2FA: If Google 2FA prompt appears, alert user with a single sentence to confirm.
4. Extract Factual Evidence: Identify failing external HTTP requests, status codes, timeouts, constraint violations, and payment/contract state.
5. Output Factual Report: Return strictly the output of `analyze-lead-error.cjs` or its concise markdown equivalent.

---

## 4. Strict Factual Contract (No Speculation, No Recommendations)

- **Only Verifiable Data**: Responses must be 100% grounded in log payloads, URLs, HTTP statuses, and CRM/EWA state records.
- **Strictly Prohibited**:
  - Guesswork, theories, or subjective speculation ("догадки та міркування").
  - Philosophical blame-assignment ("На чиїй стороні проблема?", "Чи ми їх вірно обробили?").
  - Unsolicited recommendations for managers or developers ("Менеджеру...", "Розробці...").
- **Mandatory Output Format**:
  1. **Заголовок**: `🔴 Збій ліда <leadUuid> (<env>)`
  2. **Метадані**: Стан ліда, продукт (канал), страхова, повідомлення про помилку з CRM (якщо є).
  3. **Збійний запит**: Метод, повний URL, HTTP-код, пряме посилання на лог у веб-адмінці IBPM (`detailUrl`).
  4. **Підтвердження з логів (Error snippet)**: Точний сирий текст помилки (JSON `constraintViolations`, рядок `Caused by:`, повідомлення про таймаут або тіло 400/500).
  5. **Оплата та договір (факти)**:
     - Оплата: статус (сплачено / не сплачено), точна сума, платіжна система, дата/час postback.
     - Договір: ID в EWA, номер, статус у провайдері, наявність згенерованого файлу поліса.
