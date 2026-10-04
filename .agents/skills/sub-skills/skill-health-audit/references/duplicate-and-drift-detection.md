# 🔍 Duplicate & Drift Detection — Виявлення дублікатів та застарілих скілів

## 1. Патерни дублювання в базі скілів

У монорепозиторії можуть виникати такі типи дублювання:

1. **Типографічні одруки (Typo Duplicates)**:
   - Приклад: `frontend-desing` (з помилкою в слові "design") поруч із `frontend-design`.
   - Приклад: `beautiful-desing` (з помилкою в слові "design").
2. **Версійні дублікати (Suffix Duplicates)**:
   - Приклад: `test-driven-development` та `test-driven-development-tdd`.
   - Приклад: `design-taste-frontend` та `design-taste-frontend-v1`.
3. **Контентні дублікати (Overlap)**:
   - Два скіли описують одну і ту саму дію під різними назвами.

---

## 2. Протокол безпечного злиття (Canonical Merge Protocol)

1. **Вибір канонічної назви**:
   - Назва повинна бути в `kebab-case`, англійською мовою, без одруків (`beautiful-design`, `frontend-design`, `test-driven-development`).
2. **Перевірка унікального контенту**:
   - Порівняти обидва файли: чи є в застарілому скілі унікальні інструкції, які відсутні в канонічному?
   - Якщо є — перенести їх у відповідний `references/*.md` канонічного скіла.
3. **Видалення застарілої директорії**:
   - `rm -rf .agents/skills/sub-skills/<deprecated-skill>`
4. **Видалення застарілого симлінка**:
   - `rm .claude/skills/<deprecated-skill>`
   - Якщо потрібно зберегти зворотну сумісність для Claude, можна тимчасово створити alias-симлінк, але краще оновити посилання в коді.
5. **Глобальний find & replace**:
   - Оновити посилання в `.agents/AGENTS.md`, `agents_frontend.md`, `agents_backend.md`, `agents_review.md`.
