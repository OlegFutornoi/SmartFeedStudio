/* eslint-disable */
/**
 * YouTrack Task Fetcher for insurance-e2e
 * 
 * Usage:
 *   node .agents/skills/youtrack-reader/scripts/fetch-task.cjs <issueUrl_or_issueId>
 * 
 * Examples:
 *   node .agents/skills/youtrack-reader/scripts/fetch-task.cjs INSDEV-4750
 *   node .agents/skills/youtrack-reader/scripts/fetch-task.cjs https://youtrack.treeum.net/issue/INSDEV-4750
 */

const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "../../../../");
const stateDir = path.resolve(projectRoot, ".playwright-cli");
const stateFile = path.resolve(stateDir, "youtrack-state.json");
const tempDir = path.resolve(projectRoot, ".temp");

const defaultHost = "https://youtrack.treeum.net";

function resolveIssueUrl(input) {
    if (!input) return null;
    const trimmed = input.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }
    // Clean key (e.g. INSDEV-4750 or #INSDEV-4750)
    const issueKey = trimmed.replace(/^#/, "");
    return `${defaultHost}/issue/${issueKey}`;
}

async function main() {
    const rawInput = process.argv[2];
    if (!rawInput) {
        console.error("❌ Помилка: Вкажіть посилання на задачу або її ідентифікатор.");
        console.error("Приклад: node .agents/skills/youtrack-reader/scripts/fetch-task.cjs INSDEV-4750");
        process.exit(1);
    }

    const issueUrl = resolveIssueUrl(rawInput);
    console.log(`\n🔍 Завантаження задачі YouTrack: ${issueUrl}`);

    if (!fs.existsSync(stateFile)) {
        console.warn(`\n⚠️ Файл сесії не знайдено: ${stateFile}`);
        console.warn("👉 Будь ласка, виконайте перший вхід командою:");
        console.warn(`   node .agents/skills/youtrack-reader/scripts/login.cjs "${issueUrl}"\n`);
        process.exit(2);
    }

    const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const context = await browser.newContext({
        storageState: stateFile,
        viewport: { width: 1440, height: 900 }
    });

    const page = await context.newPage();

    try {
        console.log("⏳ Відкриття сторінки задачі...");
        const response = await page.goto(issueUrl, {
            waitUntil: "networkidle",
            timeout: 45000
        });

        // Додаткове очікування рендеру YouTrack SPA
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        if (currentUrl.includes("/auth") || currentUrl.includes("/login")) {
            console.error("\n❌ Сесія YouTrack застаріла або недійсна (відбувся редирект на сторінку логіну).");
            console.error("👉 Будь ласка, оновіть сесію командою:");
            console.error(`   node .agents/skills/youtrack-reader/scripts/login.cjs "${issueUrl}"\n`);
            await browser.close();
            process.exit(2);
        }

        // Чекаємо на появу заголовка або опису
        try {
            await page.waitForSelector('h1, [data-test="issue-summary"], .yt-issue-view__summary, .ring-heading', { timeout: 15000 });
        } catch (e) {}

        // Витягуємо дані зі сторінки через DOM
        const issueData = await page.evaluate(() => {
            const result = {
                url: window.location.href,
                id: "",
                summary: "",
                description: "",
                fields: {},
                tags: [],
                attachments: [],
                comments: []
            };

            // 1. Issue ID
            const idEl = document.querySelector('[data-test="issue-id"]') ||
                         document.querySelector('.yt-issue-view__id') ||
                         document.querySelector('.issue-id');
            if (idEl) {
                result.id = idEl.textContent.trim();
            } else {
                const match = window.location.pathname.match(/\/issue\/([A-Za-z0-9_-]+)/);
                if (match) result.id = match[1];
            }

            // 2. Summary / Title
            const summaryEl = document.querySelector('[data-test="issue-summary"]') ||
                              document.querySelector('h1.yt-issue-view__summary') ||
                              document.querySelector('h1.ring-heading') ||
                              document.querySelector('h1');
            if (summaryEl) {
                result.summary = summaryEl.textContent.trim();
            }

            // 3. Description
            const descEl = document.querySelector('[data-test="issue-description"]') ||
                           document.querySelector('.yt-issue-body') ||
                           document.querySelector('.yt-issue-view__description') ||
                           document.querySelector('.ring-markdown');
            if (descEl) {
                result.description = descEl.innerText.trim();
            }

            // 4. Fields (Status, Priority, Assignee, Subsystem, Type, etc.)
            const fieldRows = document.querySelectorAll('[data-test="issue-field"], .yt-issue-fields__item, .ring-select__button');
            fieldRows.forEach(row => {
                const text = row.innerText.trim();
                if (text && text.includes(":")) {
                    const parts = text.split(":");
                    result.fields[parts[0].trim()] = parts.slice(1).join(":").trim();
                }
            });

            // Fallback for fields in tables/chips
            document.querySelectorAll('.yt-issue-fields .yt-issue-field').forEach(field => {
                const name = field.getAttribute('data-test') || '';
                const val = field.innerText.trim();
                if (name && val) result.fields[name] = val;
            });

            // 5. Attachments
            document.querySelectorAll('a[href*="/attachment/"], img[src*="/attachment/"]').forEach(att => {
                const link = att.href || att.src;
                const name = att.title || att.alt || att.textContent.trim() || 'Attachment';
                if (link && !result.attachments.some(a => a.url === link)) {
                    result.attachments.push({ name, url: link });
                }
            });

            // 6. Comments
            const commentEls = document.querySelectorAll('[data-test="issue-comment"], .yt-issue-comment');
            commentEls.forEach(comm => {
                const authorEl = comm.querySelector('[data-test="comment-author"], .yt-issue-comment__author');
                const textEl = comm.querySelector('[data-test="comment-text"], .yt-issue-comment__text, .ring-markdown');
                const dateEl = comm.querySelector('time, [data-test="comment-date"]');

                const author = authorEl ? authorEl.textContent.trim() : 'Unknown';
                const text = textEl ? textEl.innerText.trim() : '';
                const date = dateEl ? dateEl.textContent.trim() : '';

                if (text) {
                    result.comments.push({ author, date, text });
                }
            });

            return result;
        });

        await browser.close();

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outJson = path.join(tempDir, "youtrack-issue.json");
        const outMd = path.join(tempDir, "youtrack-issue.md");

        fs.writeFileSync(outJson, JSON.stringify(issueData, null, 2), "utf-8");

        // Генеруємо зручний Markdown для агента та інженера
        const markdown = `
# [YouTrack Задача: ${issueData.id || "Unknown"}] ${issueData.summary}

- **URL:** ${issueData.url}
${Object.entries(issueData.fields).map(([k, v]) => `- **${k}:** ${v}`).join("\n")}

---

## 📝 Опис задачі (Description)

${issueData.description || "*(Опис порожній або не завантажився)*"}

---

${issueData.attachments.length > 0 ? `## 📎 Вкладення (${issueData.attachments.length})\n${issueData.attachments.map(a => `- [${a.name}](${a.url})`).join("\n")}\n\n---` : ""}

${issueData.comments.length > 0 ? `## 💬 Коментарі (${issueData.comments.length})\n${issueData.comments.map(c => `### ${c.author} (${c.date}):\n${c.text}\n`).join("\n")}` : ""}
`.trim();

        fs.writeFileSync(outMd, markdown, "utf-8");

        console.log("\n=================================================");
        console.log(`🎉 Задачу успішно вивантажено: ${issueData.id} - ${issueData.summary}`);
        console.log(`📁 Збережено у Markdown: ${outMd}`);
        console.log(`📁 Збережено у JSON: ${outJson}`);
        console.log("=================================================\n");

        // Виводимо Markdown у консоль для передачі агенту
        console.log(markdown);

    } catch (error) {
        await browser.close();
        console.error("❌ Помилка під час вивантаження задачі:", error.message);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
