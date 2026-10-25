/* eslint-disable */
/**
 * Interactive YouTrack Login Script for insurance-e2e
 * 
 * Usage:
 *   node .agents/skills/youtrack-reader/scripts/login.cjs [startUrl]
 * 
 * Opens a visible browser window so the user can log in via corporate SSO / Google / LDAP.
 * Saves the authenticated session into .playwright-cli/youtrack-state.json.
 */

const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

const projectRoot = path.resolve(__dirname, "../../../../");
const stateDir = path.resolve(projectRoot, ".playwright-cli");
const stateFile = path.resolve(stateDir, "youtrack-state.json");

const defaultHost = "https://youtrack.treeum.net";

async function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function main() {
    const targetUrl = process.argv[2] || defaultHost;

    if (!fs.existsSync(stateDir)) {
        fs.mkdirSync(stateDir, { recursive: true });
    }

    console.log("=================================================");
    console.log("🔐 Авторизація в YouTrack через Playwright");
    console.log(`🔗 Відкриваємо вікно браузера: ${targetUrl}`);
    console.log("👉 Будь ласка, виконайте вхід у відкритому вікні браузера.");
    console.log("=================================================\n");

    const browser = await chromium.launch({
        headless: false,
        args: ["--start-maximized"]
    });

    const contextOptions = { viewport: null };
    if (fs.existsSync(stateFile)) {
        try {
            contextOptions.storageState = stateFile;
        } catch (e) {}
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    await page.goto(targetUrl);

    // Чекаємо на ручний вхід або автоматично визначаємо успішний логін
    console.log("⏳ Очікування завершення входу...");
    console.log("💡 Після успішного входу поверніться в термінал і натисніть Enter (або зачекайте 10с після входу).");

    let isCompleted = false;

    // Фонова перевірка URL та cookies
    const autoDetector = setInterval(async () => {
        try {
            const currentUrl = page.url();
            const cookies = await context.cookies();
            const hasAuthCookie = cookies.some(c => c.name.includes("YT") || c.name.includes("OAuth") || c.name.includes("hub") || c.name.includes("session"));
            
            // Якщо URL не є сторінкою логіну / auth
            if (!currentUrl.includes("/auth") && !currentUrl.includes("/login") && !currentUrl.includes("/oauth")) {
                const isIssueOrDashboard = currentUrl.includes("/issue/") || currentUrl.includes("/issues") || currentUrl.includes("/dashboard") || currentUrl.includes("/articles");
                if (isIssueOrDashboard) {
                    console.log(`\n🎉 Автоматично зафіксовано успішний вхід на: ${currentUrl}`);
                    isCompleted = true;
                    clearInterval(autoDetector);
                }
            }
        } catch (e) {}
    }, 2000);

    // Дозволяємо користувачу також натиснути Enter у консолі
    await Promise.race([
        promptUser("\n👉 Натисніть [Enter] у цьому терміналі, коли вхід буде виконано: "),
        new Promise((resolve) => {
            const checkTimer = setInterval(() => {
                if (isCompleted) {
                    clearInterval(checkTimer);
                    resolve(true);
                }
            }, 1000);
        })
    ]);

    clearInterval(autoDetector);

    // Зберігаємо сесію
    await context.storageState({ path: stateFile });
    console.log(`\n💾 Сесію успішно збережено у: ${stateFile}`);

    await browser.close();
    console.log("✨ Авторизацію завершено. Тепер скіл може відкривати задачі автоматично у фоні!");
}

main().catch(err => {
    console.error("❌ Помилка під час авторизації:", err.message);
    process.exit(1);
});
