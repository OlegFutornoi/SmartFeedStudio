#!/usr/bin/env node
/* eslint-disable */
/**
 * Triage and analysis tool for Playwright test-results.
 * Automatically classifies failures as SITE/BACKEND vs TEST/AUTOMATION vs INFRASTRUCTURE.
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const ROOT_DIR = process.cwd();
const TEST_RESULTS_DIR = path.resolve(ROOT_DIR, 'test-results');

function findDirectories(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => path.join(dir, entry.name));
}

function parseErrorContext(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');

  const nameMatch = content.match(/- Name:\s*(.+)/);
  const locationMatch = content.match(/- Location:\s*(.+)/);
  const errorDetailsMatch = content.match(
    /# Error details\s+```(?:ts|js|bash|text)?\n([\s\S]*?)```/,
  );

  // Also extract second code block if present
  const codeBlocks = [...content.matchAll(/```(?:ts|js|bash|text)?\n([\s\S]*?)```/g)];
  let fullError = '';
  if (codeBlocks.length >= 1) {
    fullError = codeBlocks.map((b) => b[1].trim()).join('\n---\n');
  }

  return {
    testName: nameMatch ? nameMatch[1].trim() : 'Unknown Test',
    location: locationMatch ? locationMatch[1].trim() : 'Unknown Location',
    actualError: errorDetailsMatch ? errorDetailsMatch[1].trim() : '',
    errorText:
      fullError || (errorDetailsMatch ? errorDetailsMatch[1].trim() : 'No error details found'),
    rawContent: content,
  };
}

function analyzeTrace(traceZipPath) {
  if (!fs.existsSync(traceZipPath)) return null;

  try {
    const zip = new AdmZip(traceZipPath);
    const entries = zip.getEntries();
    const networkErrors = [];
    const consoleErrors = [];
    let lastActionError = null;

    for (const entry of entries) {
      if (entry.entryName.endsWith('.network')) {
        const lines = zip.readAsText(entry).split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.method === 'response' && event.params && event.params.response) {
              const resp = event.params.response;
              if (resp.status >= 400) {
                networkErrors.push({
                  url: resp.url,
                  status: resp.status,
                  statusText: resp.statusText,
                });
              }
            }
          } catch (e) {}
        }
      } else if (entry.entryName.endsWith('.trace')) {
        const lines = zip.readAsText(entry).split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === 'action' && data.metadata?.error?.message) {
              lastActionError = {
                apiName: data.metadata.apiName,
                message: data.metadata.error.message,
              };
            }
            if (data.type === 'console' && data.messageType === 'error') {
              consoleErrors.push(data.text);
            }
          } catch (e) {}
        }
      }
    }

    return {
      networkErrors: networkErrors.slice(0, 10),
      consoleErrors: consoleErrors.slice(0, 10),
      lastActionError,
    };
  } catch (err) {
    return { error: `Failed to read trace.zip: ${err.message}` };
  }
}

function classifyFailure(errorContext, traceInfo) {
  const errorDetails = (errorContext.actualError || errorContext.errorText || '').toLowerCase();
  const text = (errorContext.errorText + ' ' + (errorContext.rawContent || '')).toLowerCase();
  const netErrors = traceInfo?.networkErrors || [];

  // Check for HTTP 5xx or specific site/backend issues
  const has5xx = netErrors.some((e) => e.status >= 500);
  const has4xx = netErrors.some(
    (e) => e.status === 400 || e.status === 403 || e.status === 404 || e.status === 422,
  );

  const isSiteInfraError =
    errorDetails.includes('500') ||
    errorDetails.includes('502') ||
    errorDetails.includes('503') ||
    errorDetails.includes('504') ||
    errorDetails.includes('524') ||
    errorDetails.includes('server returned http') ||
    text.includes('сайт тимчасово не працює') ||
    text.includes('502') ||
    text.includes('503') ||
    text.includes('504') ||
    text.includes('524') ||
    text.includes('cloudflare') ||
    text.includes('varnish') ||
    text.includes('bad gateway') ||
    text.includes('gateway timeout') ||
    text.includes('шлюзу мтсбу') ||
    text.includes('infrastructure error') ||
    text.includes('не вдалося завантажити') ||
    text.includes('тимчасово не завантаж') ||
    text.includes('service unavailable') ||
    has5xx;

  const isStrictViolation =
    errorDetails.includes('strict mode violation') || errorDetails.includes('resolved to');
  const isLocatorTimeout =
    errorDetails.includes('waiting for locator') ||
    errorDetails.includes('element is not visible') ||
    (errorDetails.includes('timeout') && errorDetails.includes('locator'));
  const isFrameDetached =
    errorDetails.includes('net::err_aborted') ||
    errorDetails.includes('frame was detached') ||
    errorDetails.includes('target closed');
  const isAssertionMismatch =
    errorDetails.includes('expect(') ||
    (errorDetails.includes('expected') &&
      (errorDetails.includes('received') ||
        errorDetails.includes('tobetruthy') ||
        errorDetails.includes('toequal') ||
        errorDetails.includes('tobegreaterthan') ||
        errorDetails.includes('tocontain')));

  if (isSiteInfraError) {
    return {
      side: 'SITE / BACKEND (Сторона додатку / шлюзу)',
      sideCode: 'SITE_ERROR',
      category: 'Infrastructure / 3rd-Party Gateway / Backend 5xx',
      icon: '🔴',
      reason:
        'Бекенд, шлюз МТСБУ або провайдери (EWA/AIWA) повернули помилку сервера (500/502/503/524) або стан недоступності каталогу ("не вдалося завантажити", "Сайт тимчасово не працює").',
      requiredSkills: ['pw-heal', 'karpathy-guidelines', 'pw-mock'],
      recommendedAction:
        '1) Перевірити доступність API через env-healthcheck.ts.\n2) Якщо баг підтверджено на проді/стейджі — розмітити тест як e2eTest.fixme(...) з описом YouTrack та повідомити команду бекенду/інфраструктури.\n3) У разі потреби змокувати ендпоінт через pw-mock.',
    };
  }

  if (isStrictViolation) {
    return {
      side: 'OUR TEST (Наша сторона / автотести)',
      sideCode: 'TEST_ERROR',
      category: 'Strict Mode Violation (дублювання селектора)',
      icon: '🟡',
      reason:
        'Локатор вибрав більше ніж 1 елемент у DOM (потрібно уточнити селектор або використати .first() / data-testid).',
      requiredSkills: ['pw-pom', 'playwright-best-practices', 'pw-heal'],
      recommendedAction:
        '1) Уточнити локатор у Page Object (app-finance або app-minfin).\n2) Використати унікальний data-testid, getByRole з exact name або .first().',
    };
  }

  if (isFrameDetached && text.includes('timeout of 150000ms exceeded')) {
    return {
      side: 'SITE / TIMING (Сторона сайту або таймаут очікування)',
      sideCode: 'SITE_OR_TIMING',
      category: 'Global Test Timeout / Unresponsive Page Reload',
      icon: '🔴',
      reason:
        'Сторінка не відповіла за 150 секунд або зависла під час page.reload() через падіння бекенду/шлюзу.',
      requiredSkills: ['pw-heal', 'karpathy-guidelines'],
      recommendedAction:
        '1) Дослідити trace.zip за допомогою parse-trace.js або extract-trace.py.\n2) Перевірити мережеві запити на предмет завислих pending/504 викликів.\n3) Прибрати зайві page.reload() у retry-циклах.',
    };
  }

  if (isAssertionMismatch) {
    return {
      side: 'OUR TEST / BUSINESS ASSERTION (Невідповідність асерції)',
      sideCode: 'TEST_OR_DATA',
      category: 'Assertion Value Mismatch',
      icon: '🟡',
      reason:
        'Отримане на UI значення не відповідає очікуваному (зміна форматування, ціни, кількості карток або прострочені тестові дані).',
      requiredSkills: ['pw-data', 'pw-pom', 'pw-heal'],
      recommendedAction:
        '1) Перевірити нормалізацію тексту (пробіли, регістр, валюта).\n2) Перевірити валідність тестових даних у leadRandom.ts чи constants.\n3) Оновити очікувані значення у support helper.',
    };
  }

  if (isLocatorTimeout) {
    return {
      side: 'OUR TEST / DOM CHANGED (Наша сторона або редизайн)',
      sideCode: 'TEST_ERROR',
      category: 'Locator Timeout / Element Not Found',
      icon: '🟡',
      reason:
        'Елемент не знайдено або він не став видимим за виділений таймаут (зміна селектора, анімація або перекриття overlay).',
      requiredSkills: ['pw-pom', 'playwright-best-practices', 'pw-heal'],
      recommendedAction:
        '1) Оновити локатор згідно з пріоритетом (getByRole > getByLabel > getByTestId).\n2) Перевірити чи не перекритий елемент модалкою (Escape / scrollIntoView).\n3) Замінити статичні очікування на expect.poll.',
    };
  }

  return {
    side: 'INVESTIGATION REQUIRED (Потрібне додаткове уточнення)',
    sideCode: 'UNKNOWN',
    category: 'General Failure',
    icon: '⚪',
    reason: 'Помилка вимагає ручного аналізу трейсу та логів.',
    requiredSkills: ['pw-heal', 'karpathy-guidelines', 'pw-review'],
    recommendedAction:
      '1) Запустити extract-trace.py test-results/.../trace.zip.\n2) Запустити тест локально з прапорцем --headed або trace-view.',
  };
}

function generatePlan(testName, classification) {
  const slug = testName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  return `
### 📝 Обов'язковий План виправлення помилки (Remediation Plan)

#### 1. 🎯 Мета:
Усунути падіння тесту: \`${testName}\`

#### 2. 🔍 Першопричина (Root Cause):
- **Сторона:** ${classification.icon} **${classification.side}**
- **Категорія:** ${classification.category}
- **Суть проблеми:** ${classification.reason}

#### 3. 🧩 Матриця задіяних скілів (Skills to Execute):
${classification.requiredSkills.map((s) => `- \`.agents/skills/${s}/\``).join('\n')}

#### 4. 🛠️ Покрокові дії:
${classification.recommendedAction}

#### 5. 🧪 Критерії завершення (Verification Gate):
- [ ] Локальний запуск: \`npx playwright test --grep "${testName.slice(0, 30)}" --project=...\` завершується зі статусом **PASSED** (або коректним **SKIPPED/fixme**).
- [ ] Перевірка лінтером: \`npm run lint\` проходить без зауважень.
`;
}

function runTriage() {
  console.log('🔍 [Playwright Test Results Triage] Сканування папки test-results...\n');

  const resultDirs = findDirectories(TEST_RESULTS_DIR);
  if (resultDirs.length === 0) {
    console.log('✅ Папка test-results порожня або не містить збережених артефактів падінь.');
    return;
  }

  const reportItems = [];

  for (const dir of resultDirs) {
    const errorContextPath = path.join(dir, 'error-context.md');
    const traceZipPath = path.join(dir, 'trace.zip');

    if (!fs.existsSync(errorContextPath)) {
      continue;
    }

    const errorContext = parseErrorContext(errorContextPath);
    const traceInfo = analyzeTrace(traceZipPath);
    const classification = classifyFailure(errorContext, traceInfo);
    const plan = generatePlan(errorContext.testName, classification);

    reportItems.push({
      dirName: path.basename(dir),
      dirPath: dir,
      errorContext,
      traceInfo,
      classification,
      plan,
    });
  }

  if (reportItems.length === 0) {
    console.log('✅ Усі папки в test-results не містять файлів помилок error-context.md.');
    return;
  }

  console.log(`📊 Знайдено ${reportItems.length} артефактів невдалих тестів:\n`);
  console.log('='.repeat(100));

  reportItems.forEach((item, index) => {
    console.log(`\n[#${index + 1}] 📁 Папка: ${item.dirName}`);
    console.log(`🧪 Тест: ${item.errorContext.testName}`);
    console.log(`📍 Локація: ${item.errorContext.location}`);
    console.log(`🚩 Сторона проблеми: ${item.classification.icon} ${item.classification.side}`);
    console.log(`📌 Категорія: ${item.classification.category}`);
    console.log(`🔎 Причина: ${item.classification.reason}`);

    if (item.traceInfo?.networkErrors?.length > 0) {
      console.log(`🌐 Мережеві помилки (HTTP 4xx/5xx):`);
      item.traceInfo.networkErrors.forEach((n) => {
        console.log(`   - [${n.status}] ${n.url}`);
      });
    }

    console.log('\n' + '-'.repeat(80));
    console.log(item.plan);
    console.log('='.repeat(100));
  });
}

runTriage();
