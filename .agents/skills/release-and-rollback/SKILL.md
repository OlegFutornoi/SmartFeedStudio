---
name: release-and-rollback
description: Управління версіями (SemVer), генерація CHANGELOG, пост-деплойне smoke-тестування та стратегія швидкого відкату (Rollback) без втрати даних
---

# 🚀 Release & Rollback — Релізи, Smoke-валідація та Безпечний Відкат

> **Призначення:** Забезпечення детермінованого циклу релізу монорепозиторію: семантичне версіонування (SemVer), автоматична генерація списку змін, пост-деплойні перевірки здоров'я (`health check`) та план миттєвого відкату без пошкодження або втрати даних у PostgreSQL.

---

## ⚡ Швидкий старт (Routing Table)

| Тригер / Потреба                       | Документ / Довідник                                                            | Що містить                                                                                 |
| :------------------------------------- | :----------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| Версіонування та генерація CHANGELOG   | [`references/semver-and-changelog.md`](./references/semver-and-changelog.md)   | Правила SemVer (MAJOR.MINOR.PATCH), парсинг Conventional Commits, оновлення `package.json` |
| Пост-деплойні перевірки працездатності | [`references/post-deployment-smoke.md`](./references/post-deployment-smoke.md) | Перевірка `/health`, пінги Redis/MinIO, smoke E2E сьют Playwright на проді                 |
| Стратегія відкату без втрати даних     | [`references/zero-loss-rollback.md`](./references/zero-loss-rollback.md)       | Rollback деплою Railway/Docker, міграції backward-compatibility, відкат станів             |

---

## 🏛 4 Залізні правила безпечного релізу

1. **Двостороння сумісність БД (Backward Compatibility First)**:
   - Новий реліз **ніколи** не повинен ламати попередню версію коду, що ще працює під час rolling-update.
   - Застосовується патерн `db-migrations-zero-downtime` (Expand -> Migrate -> Contract).
2. **Обов'язковий Post-Deployment Smoke Check**:
   - Після викатки в середовище обов'язково викликається ендпоінт `/api/health` та виконується базовий Playwright auth smoke-test.
   - При будь-якому коді помилки ≥ 500 — негайне зупинення та тригер процедури Rollback.
3. **Automated Verification Before Release Tag**:
   - Жоден тег `vX.Y.Z` не створюється без проходження:
     1. `tsc --noEmit` у всіх пакетах.
     2. `pnpm build:shared && pnpm build`.
     3. 100% проходження автоматичних тестів.
4. **Strict SemVer Semantic Rules**:
   - `MAJOR`: Зміна API контрактів або видалення полів у `@smartfeed/shared`.
   - `MINOR`: Нові фічі, нові ендпоінти, нові UI екрани.
   - `PATCH`: Багфікси, оптимізації стилів, оновлення залежностей.

---

## 📋 Чеклист перед випуском релізу

- [ ] Виконано `pnpm --filter @smartfeed/shared build`
- [ ] Виконано статичний тайпчек `tsc --noEmit` по всьому монорепо
- [ ] Оновлено `CHANGELOG.md` двома мовами або стандартним форматом
- [ ] Перевірено відсутність незастосованих або блокуючих міграцій БД
- [ ] Підготовлено план швидкого відкату (команда `railway rollback` або git revert)
