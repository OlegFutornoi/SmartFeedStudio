# 📋 Задача QA-02: Інтеграція e2e-фреймворку в GitHub Actions CI

> **Тип:** Автоматизація та інфраструктура тестування (`QA-`)  
> **Статус:** 📋 Беклог (Backlog)  
> **Пріоритет:** 🥈 Середній (реалізується після наповнення першими тест-кейсами)  
> **Відповідальні агенти:** `@agents_qa`, `@agents_devops`

---

## 1. Ціль задачі

Налаштувати запуск end-to-end автотестів у CI (GitHub Actions) для перевірки pull request-ів та релізів без ручного втручання.

## 2. Кроки реалізації

1. Створити окремий workflow `.github/workflows/e2e.yml`.
2. Налаштувати підняття контейнерів Docker (`postgres`, `redis`, `sqlite-dev`, `sqlite-dev-e2e`).
3. Виконати міграції тестової БД (`pnpm e2e:server:db:sync`).
4. Запустити фонові процеси dev-серверів (`pnpm dev:backend`, `pnpm dev:admin`, `pnpm dev:desktop:e2e`).
5. Запустити `pnpm e2e` з вивантаженням HTML/JUnit звітів у GitHub Actions Artifacts.
