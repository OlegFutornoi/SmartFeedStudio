#!/usr/bin/env node
/**
 * Task & Plan Manager Script for SmartFeed Studio e2e test-author pipeline.
 * Usage:
 *   node .agents/skills/test-author/scripts/plan-manager.js create <task-slug> <Title> <Direction> [Author]
 *   node .agents/skills/test-author/scripts/plan-manager.js close <task-slug> [Summary]
 *   node .agents/skills/test-author/scripts/plan-manager.js list
 *
 * Example task-slug: qa-fe-01-dashboard-view or qa-be-01-auth-lifecycle
 */

import fs from 'node:fs';
import path from 'node:path';

// When run from e2e root or repo root:
const cwd = process.cwd();
const E2E_DIR = cwd.endsWith('e2e') ? cwd : path.join(cwd, 'e2e');
const TASKS_DIR = path.join(E2E_DIR, 'tasks');
const ACTIVE_DIR = path.join(TASKS_DIR, 'active');
const COMPLETED_DIR = path.join(TASKS_DIR, 'completed');
const README_PATH = path.join(TASKS_DIR, 'README.md');

function ensureDirs() {
  if (!fs.existsSync(TASKS_DIR)) fs.mkdirSync(TASKS_DIR, { recursive: true });
  if (!fs.existsSync(ACTIVE_DIR)) fs.mkdirSync(ACTIVE_DIR, { recursive: true });
  if (!fs.existsSync(COMPLETED_DIR)) fs.mkdirSync(COMPLETED_DIR, { recursive: true });
}

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function initReadmeIfMissing() {
  if (!fs.existsSync(README_PATH)) {
    const initialContent = `# 📋 Реєстр задач автотестування (\`e2e/tasks/\`)

Цей реєстр фіксує всі активні та завершені задачі проєкту автотестування \`@smartfeed/e2e\`.

---

## 🏷️ Конвенція іменування задач

Усі задачі в системі автотестування \`e2e/\` мають префікс відповідно до зони тестування:
- \`qa-fe-<номер>-<коротка-назва>.md\` — Frontend / UI-тести (Admin Portal \`:3000\`, Desktop UI \`:1420\`).
- \`qa-be-<номер>-<коротка-назва>.md\` — Backend / API-тести (Server NestJS API \`:4000/api\`, Local DB SQLite Docker \`:5001\`).

---

## 🚦 Життєвий цикл задач

1. 🟡 **В роботі (\`e2e/tasks/active/\`)** — Задача створена, ведеться планування, написання Page Objects/API-клієнтів або налагодження тестів.
2. 🟢 **Виконано (\`e2e/tasks/completed/\`)** — Тести пройшли рев'ю, перевірені локальним прогоном (\`PASSED\`), лінтер та \`tsc --noEmit\` без помилок. Файл переміщується в \`completed/\`.
3. 🔴 **Заблоковано** — Роботу зупинено через критичні зовнішні блокери чи дефекти продукту.

---

## 📊 Таблиця задач

| № | Префікс / ID | Назва задачі | Напрямок | Статус | Дата створення | Дата завершення | Посилання |
|---|---|---|---|---|---|---|---|
`;
    fs.writeFileSync(README_PATH, initialContent, 'utf-8');
  }
}

function normalizeSlug(slug) {
  let s = slug.toLowerCase();
  if (s.endsWith('.md')) s = s.slice(0, -3);
  return s;
}

function validateSlug(slug) {
  if (!/^qa-(fe|be)-\d+(-[a-z0-9-]+)?$/.test(slug)) {
    console.warn(
      `⚠️ Увага: назва задачі "${slug}" не відповідає конвенції qa-fe-<номер>-<назва> або qa-be-<номер>-<назва>!`,
    );
  }
}

function createTask(rawSlug, title, direction, author = 'Antigravity') {
  ensureDirs();
  initReadmeIfMissing();

  const slug = normalizeSlug(rawSlug);
  validateSlug(slug);

  const taskFileName = `${slug}.md`;
  const targetPath = path.join(ACTIVE_DIR, taskFileName);

  if (fs.existsSync(targetPath)) {
    console.error(`❌ Задача з назвою "${taskFileName}" вже існує в e2e/tasks/active/!`);
    process.exit(1);
  }

  const today = getTodayString();
  const template = `# Задача автотестування: ${title}

## 📌 Метадані
- **ID / Slug:** \`${slug}\`
- **Напрямок / Домен:** \`${direction}\` (server:backend | server:admin | local:backend | local:desktop)
- **Дата створення:** ${today}
- **Автор:** ${author}
- **Статус:** 🟡 В роботі

---

## 🎯 Ціль та опис задачі
- [ ] Чіткий опис того, що має бути протестовано або автоматизовано (UI або API).

---

## 📝 Тестові сценарії
1. **Сценарій 1 (Happy Path / Positive):**
   - Кроки:
   - Очікуваний результат:
2. **Сценарій 2 (Edge cases / Error handling / Boundary / Negative):**
   - Кроки:
   - Очікуваний результат:

---

## 🏗️ План змін у коді
- [ ] Клієнти / Page Objects: \`e2e/server/.../pages/...\` або \`e2e/local/.../clients/...\`
- [ ] Специфікація тесту: \`e2e/.../specs/*.spec.ts\`
- [ ] Очищення тестових даних (Ізоляція даних \`runId\` / DB Cleanup)

---

## 🧪 Верифікація та критерії готовності
- [ ] Компіляція: \`pnpm --filter @smartfeed/e2e typecheck\` (0 помилок).
- [ ] Локальний запуск: \`pnpm e2e:${direction}\` або \`npx playwright test --project=${direction}\` (статус \`PASSED\`, 3 стабільні прогони).
- [ ] 0 Flaky тестів.
- [ ] Ізоляція: тестові дані очищено, робочі акаунти не зачеплені.
- [ ] Переміщення задачі у \`e2e/tasks/completed/\`.
`;

  fs.writeFileSync(targetPath, template, 'utf-8');
  console.log(`✅ Створено нову активну задачу: e2e/tasks/active/${taskFileName}`);

  // Update README.md
  let readme = fs.readFileSync(README_PATH, 'utf-8');
  const lines = readme.split('\n');
  const tableRows = lines.filter(
    (l) => l.startsWith('|') && !l.includes('Префікс / ID') && !l.includes('---|'),
  );
  const nextIndex = tableRows.length + 1;

  const newRow = `| ${nextIndex} | \`${slug}\` | ${title} | ${direction} | 🟡 В роботі | ${today} | - | [${taskFileName}](file://e2e/tasks/active/${taskFileName}) |`;
  readme = readme.trimEnd() + '\n' + newRow + '\n';
  fs.writeFileSync(README_PATH, readme, 'utf-8');
  console.log(`📝 Зареєстровано задачу в e2e/tasks/README.md`);
}

function closeTask(rawSlug, summary = '') {
  ensureDirs();
  initReadmeIfMissing();

  const slug = normalizeSlug(rawSlug);
  const taskFileName = `${slug}.md`;
  const sourcePath = path.join(ACTIVE_DIR, taskFileName);
  const destPath = path.join(COMPLETED_DIR, taskFileName);

  if (!fs.existsSync(sourcePath)) {
    if (fs.existsSync(destPath)) {
      console.log(`ℹ️ Задача "${taskFileName}" вже знаходиться в e2e/tasks/completed/.`);
      return;
    }
    console.error(`❌ Задачу "${taskFileName}" не знайдено в e2e/tasks/active/!`);
    process.exit(1);
  }

  const today = getTodayString();

  // Update status in task content
  let content = fs.readFileSync(sourcePath, 'utf-8');
  content = content.replace(/🟡 В роботі/g, `🟢 Виконано (${today})`);
  if (summary) {
    content += `\n\n---\n\n## 🏁 Підсумок виконання (${today})\n${summary}\n`;
  }

  fs.writeFileSync(destPath, content, 'utf-8');
  fs.unlinkSync(sourcePath);
  console.log(
    `✅ Задачу переміщено: e2e/tasks/active/${taskFileName} ➡️ e2e/tasks/completed/${taskFileName}`,
  );

  // Update README.md
  let readme = fs.readFileSync(README_PATH, 'utf-8');
  const oldLinkPattern = new RegExp(
    `\\[${taskFileName}\\]\\(file://e2e/tasks/active/${taskFileName}\\)`,
  );
  const newLink = `[${taskFileName}](file://e2e/tasks/completed/${taskFileName})`;

  readme = readme.replace(oldLinkPattern, newLink);

  // Update status in table row containing slug
  const lines = readme.split('\n');
  const updatedLines = lines.map((line) => {
    if (line.includes(`\`${slug}\``)) {
      return line.replace('🟡 В роботі', '🟢 Виконано').replace(/\| - \|/g, `| ${today} |`);
    }
    return line;
  });

  fs.writeFileSync(README_PATH, updatedLines.join('\n'), 'utf-8');
  console.log(`📝 Оновлено статус задачі в e2e/tasks/README.md на 🟢 Виконано`);
}

function listTasks() {
  ensureDirs();
  initReadmeIfMissing();

  const activeFiles = fs.readdirSync(ACTIVE_DIR).filter((f) => f.endsWith('.md'));
  const completedFiles = fs.readdirSync(COMPLETED_DIR).filter((f) => f.endsWith('.md'));

  console.log(`\n📋 АКТИВНІ ЗАДАЧІ (e2e/tasks/active/): ${activeFiles.length}`);
  activeFiles.forEach((f) => console.log(`  🟡 ${f}`));

  console.log(`\n✅ ЗАВЕРШЕНІ ЗАДАЧІ (e2e/tasks/completed/): ${completedFiles.length}`);
  completedFiles.forEach((f) => console.log(`  🟢 ${f}`));
  console.log('');
}

const [, , command, ...args] = process.argv;

switch (command) {
  case 'create': {
    const [slug, title, direction, author] = args;
    if (!slug || !title || !direction) {
      console.log('Usage: node plan-manager.js create <task-slug> <title> <direction> [author]');
      console.log(
        'Example: node plan-manager.js create qa-fe-01-dashboard-view "Перевірка дашборду" server:admin',
      );
      process.exit(1);
    }
    createTask(slug, title, direction, author);
    break;
  }
  case 'close': {
    const [slug, ...summaryParts] = args;
    if (!slug) {
      console.log('Usage: node plan-manager.js close <task-slug> [summary]');
      process.exit(1);
    }
    closeTask(slug, summaryParts.join(' '));
    break;
  }
  case 'list': {
    listTasks();
    break;
  }
  default:
    console.log('Commands: create | close | list');
    process.exit(1);
}
