#!/usr/bin/env node
/* eslint-disable */
/**
 * Plan Manager Script for test-author pipeline.
 * Usage:
 *   node .agents/skills/test-author/scripts/plan-manager.js create <plan-slug> <Title> <Domain> [Author]
 *   node .agents/skills/test-author/scripts/plan-manager.js close <plan-slug> [Summary]
 *   node .agents/skills/test-author/scripts/plan-manager.js list
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const PLAN_DIR = path.join(ROOT_DIR, 'Plan');
const ACTIV_DIR = path.join(PLAN_DIR, 'activ');
const CLOSE_DIR = path.join(PLAN_DIR, 'close');
const README_PATH = path.join(PLAN_DIR, 'README.md');

function ensureDirs() {
  if (!fs.existsSync(PLAN_DIR)) fs.mkdirSync(PLAN_DIR, { recursive: true });
  if (!fs.existsSync(ACTIV_DIR)) fs.mkdirSync(ACTIV_DIR, { recursive: true });
  if (!fs.existsSync(CLOSE_DIR)) fs.mkdirSync(CLOSE_DIR, { recursive: true });
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
    const initialContent = `# Реєстр планів тестування (Test Engineering Plans)

Цей реєстр фіксує всі активні та завершені плани написання і рефакторингу автотестів у проекті \`insurance-e2e\`.

## 📋 Статуси планів
- 🟡 **В роботі (\`activ/\`)** — План створено, ведеться розробка, рев'ю або налагодження тестів.
- 🟢 **Закрито (\`close/\`)** — Тести успішно написані, пройшли рев'ю, лінтер та верифіковані локальним запуском.
- 🔴 **Заблоковано** — Роботу зупинено через критичні зовнішні блокери / баги бекенду.

---

## 📊 Таблиця планів

| № | Назва плану | Домен / Продукт | Статус | Дата створення | Дата закриття | Файл плану |
|---|---|---|---|---|---|---|
`;
    fs.writeFileSync(README_PATH, initialContent, 'utf-8');
  }
}

function createPlan(slug, title, domain, author = 'Antigravity') {
  ensureDirs();
  initReadmeIfMissing();

  const planFileName = `${slug}.md`;
  const targetPath = path.join(ACTIV_DIR, planFileName);

  if (fs.existsSync(targetPath)) {
    console.error(`❌ План з назвою "${planFileName}" вже існує в Plan/activ/!`);
    process.exit(1);
  }

  const today = getTodayString();
  const template = `# План реалізації: ${title}

## 📌 Метадані
- **ID / Slug:** \`${slug}\`
- **Продукт / Домен:** \`${domain}\`
- **Дата створення:** ${today}
- **Автор:** ${author}
- **Статус:** 🟡 В роботі

---

## 🎯 Ціль та опис задачі
- [ ] Чіткий опис того, що має бути протестовано або автоматизовано (UI або API).

---

## 🧩 Задіяні модулі з .agents/skills/
- **Базові:** \`karpathy-guidelines\`, \`playwright-best-practices\`
- **Проєктування:** \`pw-pom\`, \`pw-data\`, \`pw-api\`
- **Специфічні:** [ \`pw-mock\` | \`pw-payment\` | \`pw-a11y\` | \`pw-visual\` | \`http-flow-builder\` ]
- **Контроль якості:** \`pw-review\`, \`pw-heal\`
- **MCP:** \`context7\` (документація), \`playwright\` (DOM/інспекція)

---

## 📝 Тестові сценарії
1. **Сценарій 1 (Happy Path / Positive):**
   - Кроки:
   - Очікуваний результат:
2. **Сценарій 2 (Edge cases / Error handling / Negative):**
   - Кроки:
   - Очікуваний результат:

---

## 🏗️ План змін у коді
- [ ] Page Objects / API Controllers: \`app-finance/...\` / \`api/...\`
- [ ] Тестовий spec-файл: \`tests/finance/.../pages/...\` або \`tests/api/...\`
- [ ] Допоміжні утиліти: \`tests/.../support/...\`

---

## 🧪 Верифікація та критерії готовності
- [ ] Компіляція: \`npx tsc --noEmit\` без помилок.
- [ ] Лінтер: \`npm run lint\` проходить без помилок.
- [ ] Локальний запуск на ENV: \`npx playwright test <path-to-test> --project=<project>\` статус \`PASSED\`.
- [ ] Переміщення плану у \`Plan/close/\` після успішного проходження.
`;

  fs.writeFileSync(targetPath, template, 'utf-8');
  console.log(`✅ Створено новий активний план: Plan/activ/${planFileName}`);

  // Update README.md
  let readme = fs.readFileSync(README_PATH, 'utf-8');
  const lines = readme.split('\n');
  const tableRows = lines.filter(
    (l) => l.startsWith('|') && !l.includes('Назва плану') && !l.includes('---|'),
  );
  const nextIndex = tableRows.length + 1;

  const newRow = `| ${nextIndex} | ${title} | ${domain} | 🟡 В роботі | ${today} | - | [${planFileName}](file://Plan/activ/${planFileName}) |`;
  readme = readme.trimEnd() + '\n' + newRow + '\n';
  fs.writeFileSync(README_PATH, readme, 'utf-8');
  console.log(`📝 Зареєстровано план у Plan/README.md`);
}

function closePlan(slug, summary = '') {
  ensureDirs();
  initReadmeIfMissing();

  const planFileName = `${slug}.md`;
  const sourcePath = path.join(ACTIV_DIR, planFileName);
  const destPath = path.join(CLOSE_DIR, planFileName);

  if (!fs.existsSync(sourcePath)) {
    if (fs.existsSync(destPath)) {
      console.log(`ℹ️ План "${planFileName}" вже знаходиться в Plan/close/.`);
      return;
    }
    console.error(`❌ План "${planFileName}" не знайдено в Plan/activ/!`);
    process.exit(1);
  }

  const today = getTodayString();

  // Update status in plan content
  let content = fs.readFileSync(sourcePath, 'utf-8');
  content = content.replace(/🟡 В роботі/g, `🟢 Закрито (${today})`);
  if (summary) {
    content += `\n\n---\n\n## 🏁 Підсумок виконання (${today})\n${summary}\n`;
  }

  fs.writeFileSync(destPath, content, 'utf-8');
  fs.unlinkSync(sourcePath);
  console.log(`✅ План переміщено: Plan/activ/${planFileName} ➡️ Plan/close/${planFileName}`);

  // Update README.md
  let readme = fs.readFileSync(README_PATH, 'utf-8');
  const oldLinkPattern = new RegExp(`\\[${planFileName}\\]\\(file://Plan/activ/${planFileName}\\)`);
  const newLink = `[${planFileName}](file://Plan/close/${planFileName})`;

  readme = readme.replace(oldLinkPattern, newLink);

  // Update status in table row containing slug
  const lines = readme.split('\n');
  const updatedLines = lines.map((line) => {
    if (line.includes(planFileName)) {
      return line.replace('🟡 В роботі', '🟢 Закрито').replace(/\| - \|/g, `| ${today} |`);
    }
    return line;
  });

  fs.writeFileSync(README_PATH, updatedLines.join('\n'), 'utf-8');
  console.log(`📝 Оновлено статус плану в Plan/README.md на 🟢 Закрито`);
}

function listPlans() {
  ensureDirs();
  initReadmeIfMissing();

  const activeFiles = fs.readdirSync(ACTIV_DIR).filter((f) => f.endsWith('.md'));
  const closedFiles = fs.readdirSync(CLOSE_DIR).filter((f) => f.endsWith('.md'));

  console.log(`\n📋 АКТИВНІ ПЛАНИ (Plan/activ/): ${activeFiles.length}`);
  activeFiles.forEach((f) => console.log(`  🟡 ${f}`));

  console.log(`\n✅ ЗАКРИТІ ПЛАНИ (Plan/close/): ${closedFiles.length}`);
  closedFiles.forEach((f) => console.log(`  🟢 ${f}`));
  console.log('');
}

const [, , command, ...args] = process.argv;

switch (command) {
  case 'create': {
    const [slug, title, domain, author] = args;
    if (!slug || !title || !domain) {
      console.log('Usage: node plan-manager.js create <slug> <title> <domain> [author]');
      process.exit(1);
    }
    createPlan(slug, title, domain, author);
    break;
  }
  case 'close': {
    const [slug, ...summaryParts] = args;
    if (!slug) {
      console.log('Usage: node plan-manager.js close <slug> [summary]');
      process.exit(1);
    }
    closePlan(slug, summaryParts.join(' '));
    break;
  }
  case 'list': {
    listPlans();
    break;
  }
  default:
    console.log('Commands: create | close | list');
    process.exit(1);
}
