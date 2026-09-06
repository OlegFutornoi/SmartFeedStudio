---
trigger: always_on
description: Mandatory plans lifecycle, directory structure policy (active, backlog, completed), and status tracking rules.
---

# 📋 SmartFeed Studio — Plans Lifecycle & Registry Policy

## 📌 Core Rule: Strict Multi-Stage Plan Management

To ensure deterministic feature implementation, prevent scope drift, and avoid unapproved modifications to code or databases, all implementation and architecture plans MUST follow the 3-directory lifecycle below.

---

## 📂 1. Mandatory Directory Structure

All plans reside under the root `plans/` directory:

```text
plans/
├── active/        # Поточна активна задача, яку ми зараз плануємо та реалізовуємо
├── backlog/       # Стратегічні плани, беклог, архітектурні ідеї на майбутнє
├── completed/     # Успішно виконані, протестовані та верифіковані плани (100% тестів)
└── README.md      # Центральний реєстр усіх планів за категоріями
```

---

## 🛑 2. Strict Prohibition of Premature Execution & Planning Architecture Mandates

- Створивши файл плану у `plans/active/<feature_name>.md`, агент **НЕ МАЄ ПРАВА** починати модифікувати код або базу даних без явної команди користувача (наприклад: _"починай"_, _"виконуй"_, _"реалізуй план"_, _"роби"_).
- Планування та дослідження (Planning & Research Phase) **СУВОРО ВІДОКРЕМЛЕНІ** від фази виконання (Execution Phase).

### 📐 Обов'язкові архітектурні пункти кожного плану (Quality Over Speed):

Кожен план у `plans/active/` обов'язково повинен містити:

1. **Спільні контракти (Shared Contracts)**: явне визначення DTO, Zod-схем та enum у `@smartfeed/shared` до створення компонентів чи сервісів (повна заборона `any` та ad-hoc inline типів).
2. **4-рівнева модель валідації (Defense-in-Depth)**: DTO валідатори (`class-validator`), перевірка квот і бізнес-правил, RBAC/Tenant захист, обмеження БД (FK, транзакції).
3. **Бюджет модульності компонентів**: якщо компонент перевищуватиме ~250 рядків, декомпозиція на субкомпоненти (шапка, підвал, картка, хук) проектується одразу у плані.
4. **Моделювання відмов (Failure Modes)**: поведінка при недоступності мережі чи сервера, структуроване логування (жодних порожніх `catch {}`) та локалізація помилок (UA / EN).

---

## ✅ 3. Automatic Move to Completed (DoD)

Як тільки задача повністю реалізована, протестована (100% тестів пройдено) і верифікована:

1. Агент **ЗОБОВ'ЯЗАНИЙ перенести** файл плану з `plans/active/` у `plans/completed/<feature_name>.md`.
2. Проставити метадані статусу на початку файлу:
   ```markdown
   > **Статус:** ✅ **Реалізовано та протестовано (100% тестів пройдено)**  
   > **Дата виконання:** DD.MM.YYYY
   ```
3. Оновити та синхронізувати центральний реєстр у `plans/README.md` у таблиці `Завершені та протестовані плани`.
