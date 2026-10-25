/* eslint-disable */
/**
 * Helper script for ibpm-error skill:
 * Analyzes collected lead logs from ibpm-agent and generates a concise,
 * factual text report with exact log snippets, URLs, and HTTP statuses.
 * Strictly adheres to facts without guesswork, speculations, or recommendations.
 *
 * Usage:
 *   node .agents/skills/ibpm-error/scripts/analyze-lead-error.cjs <env> <leadUuid>
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function parseArgs() {
    const rawArgs = process.argv.slice(2);
    const parsed = {
        env: "prod",
        leadUuid: ""
    };

    const positional = [];

    for (const arg of rawArgs) {
        if (arg.startsWith("--env=")) {
            parsed.env = arg.split("=")[1].trim();
        } else if (arg.startsWith("--leadUuid=")) {
            parsed.leadUuid = arg.split("=")[1].trim();
        } else if (!arg.startsWith("-")) {
            positional.push(arg.trim());
        }
    }

    // Support space-separated positional args: <env> <leadUuid> or <leadUuid> <env>
    if (positional.length >= 2) {
        const knownEnvs = ["prod", "review", "review2", "stage", "intg"];
        if (knownEnvs.includes(positional[0].toLowerCase())) {
            parsed.env = positional[0].toLowerCase();
            parsed.leadUuid = positional[1];
        } else if (knownEnvs.includes(positional[1].toLowerCase())) {
            parsed.env = positional[1].toLowerCase();
            parsed.leadUuid = positional[0];
        } else {
            parsed.env = positional[0];
            parsed.leadUuid = positional[1];
        }
    } else if (positional.length === 1) {
        parsed.leadUuid = positional[0];
    }

    return parsed;
}

function findLeadFiles(rootDir, env, leadUuid) {
    const leadDataPath = path.join(rootDir, "ibpm-agent", "leadData", env, leadUuid, "latest.json");
    const rezDataPath = path.join(rootDir, "ibpm-agent", "RezLeadData", env, leadUuid, "latest.json");

    return {
        hasLeadData: fs.existsSync(leadDataPath),
        leadDataPath,
        hasRezData: fs.existsSync(rezDataPath),
        rezDataPath
    };
}

function extractFactualData(leadData, env) {
    const logs = leadData.logs || [];
    const leadInfo = leadData.lead || {};
    const rawLead = leadInfo.rawLeadData || {};
    const contracts = leadData.contracts?.items || [];
    const payments = leadData.payments?.items || [];

    const isIgnored = (path = "", url = "") => {
        const full = `${path} ${url}`.toLowerCase();
        return full.includes("/notes/add") || 
               full.includes("/api/v3/osago/lead") || 
               full.includes("google-analytics") || 
               full.includes("/mp/collect") ||
               full.includes("/api/profile/");
    };

    const failingCalls = [];
    for (const l of logs) {
        const ctx = l.contextJson?.context || {};
        const url = ctx.debug?.info?.url || ctx.debug?.info?.original_url || ctx.path || "";
        if (isIgnored(ctx.path, url)) continue;

        const code = ctx.debug?.info?.http_code !== undefined ? ctx.debug?.info?.http_code : ctx.status;
        const err = ctx.debug?.info?.error;
        const res = ctx.response || {};
        const body = res.body || res;
        const hasViolations = Array.isArray(body?.constraintViolations) && body.constraintViolations.length > 0;

        if ((code !== undefined && (code >= 400 || code === 0)) || !!err || hasViolations) {
            let snippet = "";
            if (err) {
                snippet = err;
            } else if (hasViolations) {
                snippet = JSON.stringify(body.constraintViolations, null, 2);
            } else if (body?.message) {
                if (body?.exceptionType) {
                    const causedBy = (body.message || "").split("\n").find(line => line.includes("Caused by:"));
                    snippet = causedBy ? causedBy.trim() : body.message.trim();
                } else {
                    snippet = typeof body === "object" ? JSON.stringify(body, null, 2) : String(body).trim();
                }
            } else if (body?.exceptionType) {
                snippet = String(body.exceptionType);
            } else if (typeof body === "string") {
                snippet = body.slice(0, 300);
            } else if (typeof body === "object") {
                snippet = JSON.stringify(body, null, 2);
            }

            failingCalls.push({
                logId: l.logId || l.title,
                detailUrl: l.detailUrl || l.detailHref,
                dateTime: ctx.dateTime || l.createdAt,
                method: (ctx.debug?.info?.http_method || ctx.method || "POST").toUpperCase(),
                url: url || l.service?.key || "невідомий URL",
                code: code !== undefined ? code : (err ? 0 : 500),
                snippet: snippet.trim()
            });
        }
    }

    // Payment facts
    let paymentFact = "Не оплачено";
    if (payments.length > 0) {
        const p = payments[0];
        const isPaid = p.paidFlag === "Так" || p.fields?.["Сплачено"] === "Так";
        const amount = p.expectedAmount || p.fields?.["Очікується"] || "0";
        const payTime = p.paidAt || p.fields?.["Час оплати"] || p.createdAt;
        let postback = null;
        try {
            if (p.postbackDataRaw) postback = JSON.parse(p.postbackDataRaw);
            else if (p.fields?.["Дані postback"]) postback = JSON.parse(p.fields["Дані postback"]);
        } catch {}
        const gate = postback?.gate_type || "Portmone";
        paymentFact = isPaid 
            ? `Сплачено ${amount} грн (${gate}, час: ${payTime})`
            : `Створено інвойс на ${amount} грн (не сплачено)`;
    }

    // Contract facts
    let contractFact = "Відсутній";
    if (contracts.length > 0) {
        const c = contracts[0];
        const fields = c.fields || {};
        const cId = fields["EWA ID"] || fields["ID"] || "-";
        const cNum = fields["EWA Номер"] || "-";
        const cState = fields["Стан"] || "-";
        const cFile = fields["Файли договору"] || fields["Файли пропозиції"] || "-";
        contractFact = `EWA ID: ${cId}, Номер: ${cNum}, Стан у провайдері: ${cState}, Файл поліса: ${cFile === "—" || !cFile ? "відсутній" : cFile}`;
    }

    // Deduplicate calls by method + url + code + snippet
    const uniqueCalls = [];
    const seen = new Set();
    for (const call of failingCalls) {
        const key = `${call.method} ${call.url} ${call.code} ${call.snippet}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueCalls.push(call);
        }
    }

    const insurer = contracts[0]?.fields?.["Страхова"] || rawLead.tariff?.slug || "невідомо";

    return {
        leadUuid: leadData.leadUuid || leadInfo.uuid,
        env,
        state: leadInfo.state || "unknown",
        client: rawLead.client || "finance",
        product: rawLead.type || "osago",
        insurer,
        errorMessage: rawLead.errorMessage?.trim() || null,
        failingCalls: uniqueCalls,
        paymentFact,
        contractFact
    };
}

function formatFactualReport(info) {
    const lines = [];

    lines.push(`🔴 Збій ліда ${info.leadUuid} (${info.env})`);
    lines.push(`• Стан ліда: ${info.state} | Продукт: ${info.product} (${info.client}) | Страхова: ${info.insurer}`);
    
    if (info.errorMessage) {
        const firstLine = info.errorMessage.split("\n")[0];
        lines.push(`• Помилка з CRM: ${firstLine}`);
    }

    lines.push("");

    if (info.failingCalls.length === 0) {
        lines.push("📡 Зовнішні запити:");
        lines.push("• У логах відсутні зовнішні HTTP-запити зі статусом 4xx/5xx або таймаутом.");
        if (info.errorMessage) {
            lines.push("");
            lines.push("📋 Повний текст помилки ліда:");
            lines.push("```");
            lines.push(info.errorMessage);
            lines.push("```");
        }
    } else {
        lines.push(`📡 Збійні запити (${info.failingCalls.length}):`);
        info.failingCalls.forEach((call, index) => {
            lines.push(`[${index + 1}] ${call.method} ${call.url}`);
            lines.push(`    HTTP статус: ${call.code}`);
            if (call.detailUrl) {
                lines.push(`    Лог в IBPM: ${call.detailUrl}`);
            }
            if (call.snippet) {
                lines.push("    Помилка:");
                lines.push("    ```");
                lines.push(`    ${call.snippet}`);
                lines.push("    ```");
            }
        });
    }

    lines.push("");
    lines.push("💳 Оплата та договір (факти):");
    lines.push(`• Оплата: ${info.paymentFact}`);
    lines.push(`• Договір: ${info.contractFact}`);

    return lines.join("\n");
}

function main() {
    const args = parseArgs();
    if (!args.leadUuid) {
        console.error("Помилка: обов'язково вкажіть --leadUuid=<uuid> (наприклад --leadUuid=c2f7a592-7918-4b1c-adff-161d2cff0a27)");
        process.exit(1);
    }

    const rootDir = path.resolve(__dirname, "..", "..", "..", "..");
    let files = findLeadFiles(rootDir, args.env, args.leadUuid);

    if (!files.hasLeadData) {
        console.log(`[ibpm-error] Логи для ${args.leadUuid} на ${args.env} відсутні локально. Запускаю автоматичний збір...`);
        try {
            execSync(`node ibpm-agent/open-agent.cjs --env=${args.env} --leadUuid=${args.leadUuid}`, {
                cwd: rootDir,
                stdio: "inherit"
            });
            execSync(`node ibpm-agent/open-agent.cjs --analyzeLead --env=${args.env} --leadUuid=${args.leadUuid}`, {
                cwd: rootDir,
                stdio: "inherit"
            });
            files = findLeadFiles(rootDir, args.env, args.leadUuid);
        } catch (err) {
            console.error(`[ibpm-error] Помилка під час збору логів: ${err.message}`);
            process.exit(1);
        }
    }

    if (!files.hasLeadData) {
        console.error(`[ibpm-error] Не вдалося отримати логи для ліда ${args.leadUuid} на ${args.env}.`);
        process.exit(1);
    }

    const leadData = JSON.parse(fs.readFileSync(files.leadDataPath, "utf8"));
    const factualInfo = extractFactualData(leadData, args.env);
    const report = formatFactualReport(factualInfo);

    console.log(report);
}

main();
