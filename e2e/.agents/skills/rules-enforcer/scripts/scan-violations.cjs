/* eslint-disable */
/**
 * scan-violations.cjs - executable baseline scanner for rules in .agents/rules/.
 * Usage: node .agents/skills/rules-enforcer/scripts/scan-violations.cjs [path ...] [--json] [--files] [--changed]
 * --changed  scan ONLY .ts files modified/untracked in git (reviewer mode; ignores legacy baseline)
 * Default paths: tests app-finance app-minfin client-wizard base utils api services
 * Exit code 1 if any CRITICAL (C*) violation is found.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const showFiles = args.includes("--files");
const onlyChanged = args.includes("--changed");
const roots = args.filter((a) => !a.startsWith("--"));
const targets = roots.length ? roots : ["tests", "app-finance", "app-minfin", "client-wizard", "base", "utils", "api", "services"];

const ROOT_MODULES = "fixtures|utils|api|appConstants|config|services|base|app-finance|app-minfin|client-wizard|data|tests";

const RULES = [
    { id: "C1", level: "CRITICAL", name: "Relative import to root module (use @/)", re: new RegExp(`from\\s+["'](\\.\\./)+(${ROOT_MODULES})\\b`) },
    { id: "C1b", level: "WARNING", name: "Any 2+ level relative import", re: /from\s+["'](\.\.\/){2,}/ },
    { id: "C2", level: "CRITICAL", name: "waitForTimeout / bare setTimeout (test.setTimeout allowed)", re: /\bwaitForTimeout\s*\(|(?<![.\w])setTimeout\s*\(/, onlyUnder: ["tests", "app-finance", "app-minfin", "client-wizard", "base"] },
    { id: "C3a", level: "CRITICAL", name: "XPath locator", re: /xpath=|locator\(\s*["'`]\/\/|\$x\(/ },
    { id: "C3b", level: "CRITICAL", name: "placeholder*= / react-select id selector", re: /placeholder\*=|#react-select/ },
    { id: "C4a", level: "CRITICAL", name: "click({ force: true })", re: /force:\s*true/ },
    { id: "C4b", level: "CRITICAL", name: "evaluate(el => el.click()) bypass", re: /evaluate\([^)]*\.click\(\)/ },
    { id: "C4c", level: "CRITICAL", name: "mouse.click(0, 0)", re: /mouse\.click\(\s*0\s*,\s*0\s*\)/ },
    { id: "C5", level: "CRITICAL", name: "Fuzzy status array", re: /expect\(\s*\[[\d,\s]+\]\s*\)\.toContain/ },
    { id: "C6", level: "CRITICAL", name: "any / Record<string, any>", re: /:\s*any\b|\bas any\b|Record<string,\s*any>|Promise<any>/ },
    { id: "C6b", level: "CRITICAL", name: "Record<string, unknown> (weak typing)", re: /Record<string,\s*unknown>/ },
    { id: "C7", level: "CRITICAL", name: "console.log in test/helper code", re: /\bconsole\.log\s*\(/, onlyUnder: ["tests"] },
    { id: "C8", level: "CRITICAL", name: "Hardcoded env domain in test code", re: /["'`]https?:\/\/[^"'`]*(finance\.ua|minfin\.ua|treeumapp\.net)/, onlyUnder: ["tests"] },
    { id: "M-fakeTMS", level: "MAJOR", name: "Fake TMS-XXX placeholder", re: /TMS-XXX/ },
];

const SPEC_RE = /\.(finance|minfin|api)\.ts$/;
const MAX_SPEC_LINES = 250;

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (p.endsWith(".ts")) out.push(p);
    }
    return out;
}

function changedTsFiles() {
    const out = execSync("git status --porcelain --untracked-files=all", { encoding: "utf8" });
    return out
        .split("\n")
        .map((l) => l.slice(3).trim())
        .filter((f) => f.endsWith(".ts") && !f.startsWith(".agents/") && fs.existsSync(f));
}

const files = onlyChanged ? changedTsFiles() : targets.flatMap((t) => walk(t));
const result = {};
const perFile = {};
const add = (id, file, line, text) => {
    (result[id] ||= { count: 0, files: new Set() });
    result[id].count++;
    result[id].files.add(file);
    if (showFiles) (perFile[id] ||= []).push(`${file}:${line}: ${text.trim().slice(0, 120)}`);
};

const oversized = [];
const untagged = [];
for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const lines = src.split("\n");
    lines.forEach((l, i) => {
        if (l.trim().startsWith("//") || l.trim().startsWith("*")) return;
        for (const r of RULES) {
            if (r.onlyUnder && !r.onlyUnder.some((u) => f.startsWith(u + path.sep))) continue;
            if (r.re.test(l)) add(r.id, f, i + 1, l);
        }
    });
    if (SPEC_RE.test(f)) {
        if (lines.length > MAX_SPEC_LINES) oversized.push([f, lines.length]);
        if (/\b(e2eTest|apiTest)\s*\(/.test(src) && !/\btag\s*:/.test(src)) untagged.push(f);
    }
}

const summary = Object.entries(result).map(([id, v]) => ({
    id,
    level: RULES.find((r) => r.id === id).level,
    name: RULES.find((r) => r.id === id).name,
    count: v.count,
    files: v.files.size,
}));
summary.push({ id: "M7", level: "MAJOR", name: `Spec file > ${MAX_SPEC_LINES} lines`, count: oversized.length, files: oversized.length });
summary.push({ id: "M1", level: "MAJOR", name: "Spec file without tag", count: untagged.length, files: untagged.length });

if (asJson) {
    console.log(JSON.stringify({ scanned: files.length, summary, oversized, untagged, perFile }, null, 2));
} else {
    console.log(`Scanned ${files.length} files in: ${targets.join(", ")}\n`);
    for (const s of summary.sort((a, b) => a.id.localeCompare(b.id))) console.log(`${s.level.padEnd(8)} ${s.id.padEnd(10)} ${String(s.count).padStart(5)} hits / ${String(s.files).padStart(4)} files  ${s.name}`);
    if (showFiles) for (const [id, arr] of Object.entries(perFile)) { console.log(`\n== ${id} ==`); arr.slice(0, 40).forEach((x) => console.log(x)); }
}
const critical = summary.filter((s) => s.level === "CRITICAL" && s.count > 0).length;
process.exit(critical ? 1 : 0);
