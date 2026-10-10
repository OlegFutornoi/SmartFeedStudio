---
name: i18n-localization
description: Guarantees 100% internationalization (i18n) and dictionary parity across Ukrainian (uk) and English (en) locales in Desktop (apps/desktop) and Admin Portal (apps/admin-portal). Use whenever adding or editing UI copy, dialogs, forms, toasts, buttons, errors, or running pnpm i18n:check.
---

# 🌐 100% Internationalization (i18n) & Localization Mastery

## 📌 Mission & Core Invariant

SmartFeed Studio is a strictly bilingual application supporting **Ukrainian (`uk`, default)** and **English (`en`)**.

> [!IMPORTANT]
> **Zero Hardcoded Strings**: Every user-visible text element (titles, labels, buttons, placeholders, validation hints, tooltips `title={t('...')}`, toast notifications, and backend error representations) **MUST** come from localized dictionaries. Raw text strings in JSX/TSX are strictly prohibited.

---

## 📂 Locale Architecture & Namespaces

Dictionaries reside in:

- **Desktop**: `apps/desktop/src/i18n/locales/{uk,en}/*.json`
- **Admin Portal**: `apps/admin-portal/src/i18n/locales/{uk,en}/*.json`

### Standard Namespaces

`common`, `auth`, `home`, `errors`, `plans`, `team`, `catalogs`, `suppliers`, `products`, `ai`, `cloud`, `settings`, `storage`, `featureTeaser`, `export`.

---

## 🛠 Usage Standards

### 1. Hook Invocation & Prefix Syntax

Both `apps/desktop` and `apps/admin-portal` provide the `useI18n()` hook:

```tsx
import { useI18n } from '@/i18n';

export function ActionCard() {
  const { t } = useI18n();

  return <Button title={t('common:edit')}>{t('catalogs:createCatalog')}</Button>;
}
```

- Always use the `namespace:key` format (e.g., `t('common:save')`, `t('errors:network')`).
- If interpolation is needed: `t('plans:seatsRemaining', { count: 3 })`.

### 2. Backend Error Mapping (Zero Raw English Error Leaks)

Never render raw `err.message` from Axios/Fetch directly in the Ukrainian UI. Use `getErrorMessage(err, t)` to translate HTTP errors to localized strings.

---

## 🧪 Automated Parity Verification

Always verify dictionary parity before finishing any UI task:

```bash
pnpm i18n:check
```

The script ensures:

1. Every namespace file in `uk/` exists in `en/` and vice versa.
2. Every key in `uk/` exists in `en/` with identical JSON nesting.
3. No empty string values (`""`) exist in any dictionary.

---

## ✅ Pre-Commit Checklist

- [ ] Every new string is registered in both `locales/uk/*.json` and `locales/en/*.json`
- [ ] No hardcoded English or Ukrainian strings in `.tsx` files
- [ ] Tooltips, ARIA labels, and placeholders (`placeholder={t('...')}`) are localized
- [ ] `pnpm i18n:check` exits with code 0
