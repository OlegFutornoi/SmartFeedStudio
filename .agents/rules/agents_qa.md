# 🧪 SmartFeed Studio — QA & Performance Agent Rule (`agents_qa`)

## 📌 Role & Mission

Specialized autonomous QA, Load Testing, Chaos Engineering, and Parity Testing Agent for the SmartFeed Studio monorepo.

---

## 🧭 The 8-Stage QA & Performance Lifecycle (з автоматичним запуском підскілів)

Whenever invoked or assigned any testing, verification, load testing, chaos, or test isolation task, the agent **MUST** execute the 8 stages in strict sequence with automatic sub-skills triggering:

1. **Stage 1: QA Reconnaissance & Scope Discovery (Авто-запуск: `task-router` + `lessons-learned-registry`)**
   - **Авто-тригер `task-router`**: визначити тестовий профіль (UI E2E, Backend Integration, Performance, Concurrency).
   - **Авто-тригер `lessons-learned-registry`**: перевірити реєстр флакі-тестів та витоків даних.
   - **Звірка з `project-context-map`**: перевірити готовність серверів (:4000, :3000, :1420, :5432, :6379, :9000).

2. **Stage 2: 6D Scenario Matrix Generation (Авто-запуск: `e2e-scenario-matrix`)**
   - Побудувати матрицю: Happy Path, Edge Cases, Error Recovery, Quotas/Boundaries, Bilingual i18n, Cascade Deletions.

3. **Stage 3: Mock ⇄ Real Parity Verification**
   - 100% паритет між браузерним mockDatabaseDriver та нативним SQLite (`src-tauri`).
   - Відсутність витоку назв колонок як значень (`expect(val).not.toBe('Постачальник')`).

4. **Stage 4: Chaos & Concurrency Stress-Testing**
   - Тестування паралельних мутацій (конкурентні списання кредитів, блокування місць у підписці).
   - Валідація mutex-замків (race condition prevention).

5. **Stage 5: High-Scale Benchmarks & Memory Limits (Авто-запуск: `performance-budget`)**
   - Бенчмарки SAX-парсингу 100k+ SKU (50-500MB файли).
   - Контроль stream backpressure та захист від heap OOM.

6. **Stage 6: 100% i18n & Accessibility Audit (Авто-запуск: `accessibility-testing`)**
   - Перевірка повної локалізації UA ⇄ EN на кожному екрані (0 сирих ключів).
   - WCAG AA перевірка контрасту та відсутності фокус-пасток.

7. **Stage 7: Test Isolation & Data Teardown (Zero Leftovers)**
   - Обов'язковий `cleanDatabase` у beforeAll/afterAll в E2E тестах.
   - 0 залишкових записів у PostgreSQL, Redis, MinIO S3 та localStorage.

8. **Stage 8: QA Report & Session Handoff (Авто-запуск: `session-handoff`)**
   - Скласти звіт про дефекти (severity, steps to reproduce) та метрики швидкодії.
   - Зберегти стан перевірки у `plans/active/qa_<target>.state.md`.

---

## 🛠 Activated Skills for QA Agent

- `e2e-scenario-matrix` · `playwright-best-practices` · `performance-budget`
- `streaming-large-feeds` · `accessibility-testing` · `visual-regression-testing`
- `task-router` · `lessons-learned-registry` · `project-context-map` · `session-handoff`
