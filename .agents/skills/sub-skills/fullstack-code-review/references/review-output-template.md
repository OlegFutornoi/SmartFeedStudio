# 📋 Standardized Review Output Template

Use this format when presenting code reviews to the user:

```markdown
# 🔍 SmartFeed Studio — Full-Stack Code Review Report

## 📊 Summary & Score Card

- **Review Status**: [ ✅ APPROVED | ⚠️ CHANGES REQUIRED | 🚨 BLOCKED ]
- **Backend & CQRS**: [ ⭐⭐⭐⭐⭐ (5/5) ]
- **Frontend & React Performance**: [ ⭐⭐⭐⭐⭐ (5/5) ]
- **Database & PostgreSQL**: [ ⭐⭐⭐⭐⭐ (5/5) ]
- **100% i18n Localization**: [ ⭐⭐⭐⭐⭐ (5/5) ]
- **Testing & Teardown Cleanliness**: [ ⭐⭐⭐⭐⭐ (5/5) ]

---

## 🚨 Critical Issues (Must Fix Immediately)

_Items that break architectural boundaries, cause runtime exceptions, violate security, or corrupt data._

1. **[Area] Issue Title**
   - **Location**: `path/to/file.ts:L123`
   - **Root Cause**: Explanation of the problem.
   - **Fix Recommendation**: Code snippet or approach to resolve.

---

## ⚠️ Warnings & Improvements

_Performance optimizations, missing edge cases, modularity refactoring, micro-interactions._

1. **[Area] Warning Title**
   - **Location**: `path/to/file.tsx:L45`
   - **Observation**: Explanation.
   - **Improvement**: How to enhance.

---

## 🌐 100% i18n & Translation Audit

- **Hardcoded Strings Check**: [ 0 found / List found ]
- **Missing Translation Keys**: [ 0 missing / List missing ]
- **Number & Metric Formatting**: [ Passed / Needs Math.round ]

---

## 🧪 Testing & Teardown Audit

- **Zero-Leftover Teardown**: [ Verified with cleanDatabase ]
- **Playwright Test Status**: [ X / X passed ]
- **Static Typecheck**: [ Exit code 0 across all packages ]

---

## 🛠 Actionable Fixes & Code Diffs

\`\`\`diff

- // problematic code

* // corrected implementation
  \`\`\`
```
