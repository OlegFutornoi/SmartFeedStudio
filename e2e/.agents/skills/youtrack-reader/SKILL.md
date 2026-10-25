---
name: youtrack-reader
description: Fetch, inspect, and analyze YouTrack tasks and issues by URL or Issue ID (e.g. INSDEV-XXXX, PM-XXXX, SUP-XXXX, TMS-XXXX) using persistent Playwright browser sessions. Use whenever the user provides a YouTrack link (e.g. https://youtrack.treeum.net/issue/...), asks to study a YouTrack task, inspect requirements, extract Acceptance Criteria, or analyze bug reports.
---

# YouTrack Reader & Requirements Extractor (`youtrack-reader`)

Автоматизований інструмент та скіл для читання, аналізу та вилучення вимог із задач YouTrack (`https://youtrack.treeum.net`) через збережену сесію Playwright.

---

## 1. Швидкі команди запуску (Quick Execution)

### Вивантаження задачі у фоновому режимі (Headless):

```bash
# За посиланням або номером задачі
node .agents/skills/youtrack-reader/scripts/fetch-task.cjs INSDEV-4750
node .agents/skills/youtrack-reader/scripts/fetch-task.cjs https://youtrack.treeum.net/issue/INSDEV-4750
```

### Первинний вхід / оновлення сесії (Visible Browser Window):

```bash
# Відкриває видимий браузер для одноразового логіну
node .agents/skills/youtrack-reader/scripts/login.cjs [https://youtrack.treeum.net/issue/TARGET_ID]
```

---

## 2. Повний життєвий цикл роботи зі скілом (Agent Workflow)

Коли користувач надає посилання або номер задачі YouTrack:

1. **Виклик вивантажувача:**
   - Запустити `node .agents/skills/youtrack-reader/scripts/fetch-task.cjs <URL_або_ID>`.
   - Скрипт відкриває YouTrack через збережений стан `.playwright-cli/youtrack-state.json`, витягує DOM та зберігає результат у:
     - `.temp/youtrack-issue.md` (зручний Markdown для аналізу)
     - `.temp/youtrack-issue.json` (структуровані поля: summary, fields, description, attachments, comments).

2. **Обробка застарілої сесії:**
   - Якщо сесія відсутня або застаріла (скрипт повертає код `2`), агент лаконічно повідомляє користувачу:
     > _"Будь ласка, виконайте швидкий вхід у вікні браузера командою: `node .agents/skills/youtrack-reader/scripts/login.cjs`"_

3. **Аналіз вимог та Acceptance Criteria:**
   - Прочитати `.temp/youtrack-issue.md`.
   - Виділити ключові вимоги:
     - **Scope:** Які мікросервіси зачеплено (PM, IBPM, CRM, OTP, Frontend).
     - **Acceptance Criteria (AC):** Бізнес-правила, нові поля, валідаційні обмеження.
     - **UI / API:** Чи це зміна публічного API, адмінки чи користувацьких форм.
     - **Локалізація / Граничні випадки:** Валідації, обов'язковість полів, обробка помилок.

4. **Перехід до планування тестування:**
   - На основі вивчених вимог агент автоматично переходить до `pw-plan` або `pw-test-designer`:
     - Створює план у `Plan/activ/<slug>.md`.
     - Будує матрицю граничних значень (Boundary & Nullability Matrix).
     - Розробляє перевірки згідно з інваріантами репозиторію (`agent-author.md`).

---

## 3. Збережені дані та безпека

- **Сесія (`storageState`):** зберігається локально у `.playwright-cli/youtrack-state.json`. Цей шлях додано у `.gitignore` і він гарантовано не потрапляє в Git.
- **Тимчасові файли:** `.temp/youtrack-issue.*` також ігноруються системою контролю версій.
