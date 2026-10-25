/* eslint-disable */
/**
 * Orchestrator script for pw-schema-sync skill:
 * 1. (Optional) Downloads fresh Swagger specification if --download is specified.
 * 2. Extracts and compiles AJV Draft-07 JSON schemas via tools/extract-schemas.cjs.
 * 3. Generates strong TypeScript types via tools/generate-types-from-schemas.cjs.
 * 4. Verifies ESLint compatibility.
 *
 * Usage:
 *   node .agents/skills/pw-schema-sync/scripts/sync-schemas.cjs [--download]
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "../../../../");

function runCommand(command, description) {
    console.log(`\n⏳ [${description}] Виконується: ${command}`);
    try {
        const output = execSync(command, {
            cwd: projectRoot,
            encoding: "utf-8",
            stdio: "pipe"
        });
        console.log(output.trim());
        return { success: true, output };
    } catch (error) {
        console.error(`❌ Помилка на кроці "${description}":\n`, error.stdout || error.message);
        return { success: false, error };
    }
}

async function main() {
    const args = process.argv.slice(2);
    const hasProductOrEnv = args.some(arg => arg.startsWith("--product") || arg.startsWith("--env"));

    // Якщо вказано конкретний продукт або оточення, делегуємо новому Master CLI
    if (hasProductOrEnv) {
        const cmd = `node tools/sync-schemas.cjs ${args.join(" ")}`;
        const res = runCommand(cmd, "Master API Schema Synchronizer");
        process.exit(res.success ? 0 : 1);
    }

    const shouldDownload = args.includes("--download") || args.includes("-d");

    console.log("🚀 Запуск повного циклу синхронізації схем та типів API...");

    // Крок 1: Завантаження Swagger (якщо запитано)
    if (shouldDownload) {
        const downloadRes = runCommand("node ibpm-agent/download-swagger.cjs", "Завантаження Swagger з бекенду");
        if (!downloadRes.success) {
            console.error("⚠️ Не вдалося завантажити свіжий Swagger. Зупинка процесу.");
            process.exit(1);
        }
    } else {
        const swaggerFile = path.resolve(projectRoot, "tests/api/docs/ibpm-swagger.json");
        if (!fs.existsSync(swaggerFile)) {
            console.error(`❌ Файл специфікації не знайдено: ${swaggerFile}`);
            process.exit(1);
        }
        console.log(`ℹ️ Використовується наявна специфікація: ${swaggerFile}`);
    }

    // Крок 2: Екстракція та валідація JSON-схем
    const extractRes = runCommand("node tools/extract-schemas.cjs", "Екстракція та AJV валідація JSON-схем");
    if (!extractRes.success) {
        console.error("❌ Помилка екстракції схем.");
        process.exit(1);
    }

    // Крок 3: Генерація TypeScript типів
    const typesRes = runCommand("node tools/generate-types-from-schemas.cjs", "Генерація TypeScript інтерфейсів");
    if (!typesRes.success) {
        console.error("❌ Помилка генерації типів.");
        process.exit(1);
    }

    // Крок 4: Перевірка лінтера
    const lintRes = runCommand("npm run lint", "Перевірка ESLint");
    if (!lintRes.success) {
        console.warn("⚠️ Зверніть увагу: є зауваження лінтера, рекомендується виконати npm run lint:fix");
    }

    console.log("\n========================================================");
    console.log("🎉 СИНХРОНІЗАЦІЯ СХЕМ ТА ТИПІВ УСПІШНО ЗАВЕРШЕНА!");
    console.log("📁 Збережені схеми: api/schemas/ibpm/{requests,responses}/");
    console.log("📁 Згенеровані типи: api/ibpm/models/generated/index.ts");
    console.log("========================================================\n");
}

main().catch(err => {
    console.error("Fatal error during schema sync:", err);
    process.exit(1);
});
