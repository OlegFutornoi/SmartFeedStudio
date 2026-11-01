# Керування та верифікація скілів (.agents/skills/)

Система моніторингу життєвого циклу, контролю змін (drift detection) та оцінювання 43 спеціалізованих скілів через локальні LLM-прогони (Groq, Gemini, OpenRouter).

## 1. Архітектура та відповідальні компоненти

- **GitHub Actions (`.github/workflows/skill-evals.yml`)**: виконує виключно швидку, детерміновану перевірку цілісності та структури (`pnpm agents:check`, `run-skill-evals.mjs --dry-run`, `skills-status.mjs`). Зовнішні виклики до платних чи залежних від квот LLM API повністю виключені з CI.
- **Скіл `@omniroute-delegation`**: забезпечує безкоштовний мультіпровайдерний фолбек між Google AI Studio (Gemini 2.0 Flash), Groq Cloud (Llama 3.3 70B) та OpenRouter через утиліту `omniroute-query.mjs`.
- **Скіл `@skill-creator`**: регламентує якість описів, правила найменування, структуру `evals/evals.json` (>=3 тест-кейси) та `evals/triggers.json` (>=10 тригерів).
- **Скрипт `scripts/ops/skill-state-manager.mjs`**: розраховує SHA-256 хеші файлів скілів, фіксує результати в `.agents/state/skills-eval-status.json` та синхронізує `.agents/SKILLS_STATUS.md`.
- **Скрипт `scripts/ops/skills-status.mjs`**: консольний дашборд статусу та виявлення дрифту коду (`pnpm skills:status`).
- **Скрипт `scripts/ops/run-skill-evals.mjs`**: виконання тестів якості скілів з оцінкою LLM-грейдером (`pnpm skills:eval`).
- **Скрипт `scripts/ops/run-skill-routing-evals.mjs`**: бенчмарк маршрутизації на тестовій вибірці тригерів (`pnpm skills:eval:routing`).

---

## 2. Життєвий цикл та контроль змін (Drift Detection)

Кожен скіл перебуває в одному з 4 станів:

- `[UNVERIFIED]`: структура валідна, очікує першого прогону з реальними LLM.
- `[VERIFIED]`: успішно пройшов прогін з LLM; збережено хеш коду, дату та провайдера.
- `[MODIFIED]`: код або промпти скіла змінено після попередньої верифікації (`currentHash != lastVerifiedHash`). Вимагає повторного прогону!
- `[FAILED]`: останній прогін завершився з помилкою або не набрав балів.

---

## 3. Командний довідник (Cheat Sheet)

### Перегляд статусу та виявлення дрифту

```bash
# Повний статус-звіт по всіх 43 скілах
pnpm skills:status

# Показати лише змінені, неперевірені або збійні скіли
pnpm skills:status --changed

# Отримати машинний JSON-звіт
pnpm skills:status --json

# Строга перевірка для pre-commit / пайплайнів (exit 1 якщо є MODIFIED/FAILED)
node scripts/ops/skills-status.mjs --strict
```

### Сухий структурний прогін (безкоштовно, без ключів API)

```bash
# Перевірка валідності JSON, схем та тригерів для всіх скілів
pnpm skills:eval:dry
```

### Прогін з реальними LLM-провайдерами (Groq / Gemini)

Для запуску потрібен хоча б один ключ у змінних оточення або у файлі `.env`:
`GEMINI_API_KEY`, `GROQ_API_KEY`, або `OPENROUTER_API_KEY`.

```bash
# 1. Прогнати тільки змінені або ще неперевірені скіли
pnpm skills:eval:changed

# 2. Прогнати зіставлення з бейзлайном (без завантаженого скіла)
pnpm skills:eval:changed --baseline

# 3. Прогнати конкретний скіл
pnpm skills:eval --skill=backend

# 4. Прогнати кілька обраних скілів
pnpm skills:eval --skill=backend,frontend,review

# 5. Прогнати один конкретний тест-кейс
pnpm skills:eval --skill=backend --case=1

# 6. Запустити з примусовим провайдером Groq
GROQ_API_KEY="gsk_..." pnpm skills:eval --skill=backend

# 7. Запустити з примусовим провайдером Gemini
GEMINI_API_KEY="AIza..." pnpm skills:eval --skill=backend
```

### Бенчмарк маршрутизації (Trigger Classification)

```bash
# Сухий прогін маршрутизатора
pnpm skills:eval:routing --dry-run

# Оцінка маршрутизації на тестовому спліті (1 прогін)
pnpm skills:eval:routing --split=test --runs=1

# Оцінка маршрутизації для вибраних скілів
pnpm skills:eval:routing --skills=backend,frontend
```
