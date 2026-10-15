---
name: i18n-localization
description: Internationalization (i18n) and dictionary parity verification across Ukrainian (uk) and English (en) locales in SmartFeed Studio. Use whenever adding or editing UI copy, dialogs, forms, toasts, buttons, tooltips, backend error mappings, or running pnpm i18n:check. Do not use for server database queries; use backend or database skills instead.
rules: [core, i18n, frontend]
---

# Internationalization (i18n) & Localization Mastery

## Step 0 - Load rules (mandatory, before any analysis or code)

1. Read `.agents/rules/core.md`, `.agents/rules/i18n.md`, `.agents/rules/frontend.md`.
2. Verify invariant `I18N-01`: 100% dictionary key parity between `uk` and `en`.
3. Verify invariant `I18N-02`: zero raw untranslated keys rendered in the UI.
4. Verify invariant `I18N-03`: tooltips (`title={t('...')}`) and `aria-label` must be localized.
5. Verify invariant `I18N-04`: backend errors translated via `getErrorMessage(err, t)`.
6. Verify invariant `I18N-05`: zero raw English backend enums displayed in UI tables.
7. Do not finalize UI code until steps 1-6 are verified.

## Inputs

- UI component containing text strings, form labels, or error messages.
- Locale dictionaries in `locales/uk/*.json` and `locales/en/*.json`.

## Procedure

1. Step 1 - Extract Strings into Dictionaries: locate all user-facing strings, buttons, placeholders, dialog titles, and validation errors. Add keys to both `apps/desktop/src/i18n/locales/{uk,en}/<ns>.json` and `apps/admin-portal/src/i18n/locales/{uk,en}/<ns>.json`.
2. Step 2 - Component Hook Invocation: import and invoke `const { t } = useI18n()`. Render strings using `t('namespace:key')`.
3. Step 3 - Localize HTML Attributes: wrap icon-only buttons with localized `aria-label={t('common:edit')}` and `title={t('common:edit')}`.
4. Step 4 - Intercept Backend Errors: never pass `err.message` directly into toasts. Use `getErrorMessage(err, t)` to display localized error strings.
5. Step 5 - Map Backend Enums: map database statuses (`APPROVED`, `Active`, `Done`, `Suspended`, `PENDING`) to localized display values (`Оплачено`, `Активна`, `Виконано`, `Призупинено`, `Очікує`).
6. Step 6 - Parity Verification: execute the localization parity script: `pnpm i18n:check`.

## Outputs

- Symmetrical dictionary updates in `locales/uk/*.json` and `locales/en/*.json`.
- Zero raw strings in component JSX/TSX.
- Zero untranslated keys.

## Gate (stop condition)

- `pnpm i18n:check` exits with code 0 (100% dictionary parity).
- Playwright bilingual test toggles language without missing translation warnings.
- Zero hardcoded English strings in Ukrainian locale.

## Never

- Never commit a translation key to `uk` without adding the matching key to `en` (violates `I18N-01`).
- Never leave raw English HTML titles like `title="Edit"` on icon buttons (violates `I18N-03`).
- Never display raw English backend enums in status badges (violates `I18N-05`).
- Never render unformatted floating-point percentages (violates `I18N-06`).

## References

- `references/namespace-guide.md` - read for standard namespace categories (`common`, `catalogs`, `errors`, etc.).
