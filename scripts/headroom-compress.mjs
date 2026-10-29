#!/usr/bin/env node

/**
 * Headroom Context Optimization & Compression Script for SmartFeed Studio Agents
 * Compresses plans, specs, logs, feeds, JSON, diffs, and documents before feeding to the active LLM.
 *
 * Core Capabilities:
 * 1. Cyrillic/Ukrainian Translation & Distillation: Automatically delegates translation and
 *    semantic compression of Ukrainian specs/plans to OmniRoute (port 20128) at ZERO IDE token cost,
 *    slashing token counts by 65-75% due to English BPE token density.
 * 2. Headroom Python & Formatting Pipeline: Removes duplicate blank lines, unwraps JSON strings,
 *    and formats Markdown headings for MD041/MD022 compliance.
 * 3. Two-Tier Plan Architecture: Preserves the Ukrainian human plan (<file>.md) for user review (PLAN-02)
 *    and generates the ultra-dense English machine plan (<file>.compressed.md) for AI agents.
 *
 * Usage:
 *   node scripts/headroom-compress.mjs <file-path> --save
 *   node scripts/headroom-compress.mjs <file-path> -o <output-path>
 *   node scripts/headroom-compress.mjs <file-path> [--json | --raw]
 *   cat file.md | node scripts/headroom-compress.mjs [--save]
 */

import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const UV_HEADROOM_PYTHON = '/Users/oleg/.local/share/uv/tools/headroom-ai/bin/python';
const OMNIROUTE_SCRIPT = path.join(
  ROOT_DIR,
  '.agents',
  'skills',
  'omniroute-delegation',
  'scripts',
  'omniroute-query.mjs',
);

function countEstimatedTokens(text, isCyrillic = false) {
  if (!text) return 0;
  // Cyrillic takes ~2.5 - 3.5 bytes/char in BPE tokenizers; English is ~4 chars/token
  const hasCyrillic = isCyrillic || /[\u0400-\u04FF]/.test(text);
  if (hasCyrillic) {
    return Math.ceil(text.length / 2.7);
  }
  return Math.ceil(text.length / 3.8);
}

async function readAllStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function postProcessMarkdown(text, defaultTitle = '') {
  let cleaned = text.trim();
  // Strip outer ```markdown ... ``` fence
  if (/^```(?:markdown|md)?\s*\n/i.test(cleaned) && cleaned.endsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:markdown|md)?\s*\n/i, '')
      .replace(/\n?```$/, '')
      .trim();
  }

  const lines = cleaned.split('\n');
  const processed = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Fix line 1 if model output **Title** instead of # Title
    if (i === 0 && !line.startsWith('#') && line.startsWith('**') && line.endsWith('**')) {
      line = `# ${line.slice(2, -2).trim()}`;
    }

    // Strip bold syntax inside headings: ### **Heading** -> ### Heading
    if (/^#{1,6}\s+\*\*/.test(line)) {
      line = line.replace(/^(#{1,6}\s+)\*\*([^*]+)\*\*(.*)$/, '$1$2$3');
    }

    processed.push(line);
  }

  cleaned = processed.join('\n').trim();

  // Enforce line 1 starts with # Heading (MD041)
  if (!cleaned.startsWith('#') && defaultTitle) {
    cleaned = `# ${defaultTitle}\n\n${cleaned}`;
  }

  return cleaned;
}

function validateDefectIntegrity(rawText, compressedText) {
  const origDefects = [...new Set(rawText.match(/\[DEF-\d+\]/g) || [])];
  if (origDefects.length === 0) return true;

  const missing = origDefects.filter((def) => !compressedText.includes(def));
  if (missing.length > 0) {
    console.warn(
      `[HEADROOM] WARNING: Defect integrity check flagged missing findings: ${missing.join(', ')}`,
    );
    return false;
  }
  return true;
}

function postProcessMarkdown(text, defaultTitle = '') {
  let cleaned = text.trim();
  // Strip outer ```markdown ... ``` fence
  if (/^```(?:markdown|md)?\s*\n/i.test(cleaned) && cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n?```$/, '').trim();
  }

  const lines = cleaned.split('\n');
  const processed = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Fix line 1 if model output **Title** instead of # Title
    if (i === 0 && !line.startsWith('#') && line.startsWith('**') && line.endsWith('**')) {
      line = `# ${line.slice(2, -2).trim()}`;
    }

    // Strip bold syntax inside headings: ### **Heading** -> ### Heading
    if (/^#{1,6}\s+\*\*/.test(line)) {
      line = line.replace(/^(#{1,6}\s+)\*\*([^*]+)\*\*(.*)$/, '$1$2$3');
    }

    processed.push(line);
  }

  cleaned = processed.join('\n').trim();

  // Enforce line 1 starts with # Heading (MD041)
  if (!cleaned.startsWith('#') && defaultTitle) {
    cleaned = `# ${defaultTitle}\n\n${cleaned}`;
  }

  return cleaned;
}

function validateDefectIntegrity(rawText, compressedText) {
  const origDefects = [...new Set(rawText.match(/\[DEF-\d+\]/g) || [])];
  if (origDefects.length === 0) return true;

  const missing = origDefects.filter((def) => !compressedText.includes(def));
  if (missing.length > 0) {
    console.warn(`[HEADROOM] WARNING: Defect integrity check flagged missing findings: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

async function distillAndTranslateViaOmniRoute(text, contextTitle = '') {
  const systemPrompt =
    'You are a senior systems architect and token-optimization compiler for AI coding agents. Your job is to translate and compile Ukrainian architectural plans, specs, or task files into ultra-dense, actionable, technical English specifically optimized for LLM context windows. You MUST preserve 100% of all defect IDs without omitting a single one (e.g. DEF-01 through DEF-17 must all be explicitly included), exact file paths, line numbers, rule invariants (ARCH-xx, BE-xx, SEC-xx, DB-xx, UI-xx), concrete code snippets, and Definition of Done steps. Eliminate conversational fluff, narrative pleasantries, and duplicate prose. Start with a level-1 heading (# Title). Use compact bullet lists. Never use markdown tables. Never wrap the entire response in an outer ```markdown block. Never use emojis.';

  const userPrompt = contextTitle
    ? `Document Title: ${contextTitle}\n\nCompile and compress this specification into dense technical English for AI agents (preserve all defect IDs and paths):\n\n${text}`
    : `Compile and compress this specification into dense technical English for AI agents (preserve all defect IDs and paths):\n\n${text}`;

  try {
    const { stdout } = await execFileAsync(
      'node',
      [OMNIROUTE_SCRIPT, '--max-tokens', '4096', '--system', systemPrompt, '--prompt', userPrompt],
      { maxBuffer: 15 * 1024 * 1024 },
    );
    let cleaned = stdout.trim();
    if (/^```(?:markdown|md)?\s*\n/i.test(cleaned) && cleaned.endsWith('```')) {
      cleaned = cleaned
        .replace(/^```(?:markdown|md)?\s*\n/i, '')
        .replace(/\n?```$/, '')
        .trim();
    }
    return cleaned || text;
  } catch (err) {
    console.warn(`[HEADROOM] OmniRoute translation fallback (using raw text): ${err.message}`);
    return text;
  }
}

async function compressViaHeadroom(rawContent) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import json, re, sys
from headroom.compress import compress, CompressConfig

raw = sys.stdin.read()
if not raw:
    print(json.dumps({"error": "Empty input"}))
    sys.exit(0)

def densify_markdown(text):
    stripped = text.strip()
    if stripped.startswith("\`\`\`markdown") and stripped.endswith("\`\`\`"):
        inner = stripped[len("\`\`\`markdown"):].strip()
        if inner.endswith("\`\`\`"):
            inner = inner[:-3].strip()
        if "\`\`\`" not in inner or inner.count("\`\`\`") % 2 == 0:
            text = inner

    lines = [line.rstrip() for line in text.splitlines()]
    out_lines = []
    in_code = False
    table_headers = []
    in_table = False

    for line in lines:
        if line.strip().startswith("\`\`\`"):
            if not in_code and out_lines and out_lines[-1] != "":
                out_lines.append("")
            in_code = not in_code
            in_table = False
            table_headers = []
            out_lines.append(line)
            if not in_code:
                out_lines.append("")
            continue

        if in_code:
            out_lines.append(line)
            continue

        if line.strip().startswith("|") and line.strip().endswith("|"):
            cells = [c.strip() for c in line.strip()[1:-1].split("|")]
            if all(re.match(r"^:?-{2,}:?$", c) for c in cells if c):
                in_table = True
                continue
            if not in_table and not table_headers:
                table_headers = cells
                in_table = True
                continue
            if in_table and table_headers:
                parts = []
                for idx, val in enumerate(cells):
                    if not val:
                        continue
                    hdr = table_headers[idx] if idx < len(table_headers) else f"col{idx}"
                    parts.append(f"{hdr}: {val}" if idx > 0 else val)
                if out_lines and out_lines[-1] != "" and not out_lines[-1].lstrip().startswith(("-", "*", "1.")):
                    out_lines.append("")
                out_lines.append("- " + " | ".join(parts))
                continue
        else:
            in_table = False
            table_headers = []

        if re.match(r"^#{1,6}\\s+", line):
            if out_lines and out_lines[-1] != "":
                out_lines.append("")
            out_lines.append(line)
            out_lines.append("")
            continue

        if not line.strip():
            if out_lines and out_lines[-1] != "":
                out_lines.append("")
        else:
            out_lines.append(line)

    cleaned_lines = []
    for l in out_lines:
        if l == "" and cleaned_lines and cleaned_lines[-1] == "":
            continue
        cleaned_lines.append(l)

    return chr(10).join(cleaned_lines).strip() + chr(10)

try:
    is_hybrid_markdown = bool(re.search(r"^#{1,3}\\s+", raw, re.MULTILINE))
    work_text = densify_markdown(raw) if is_hybrid_markdown else raw

    cfg = CompressConfig(
        compress_user_messages=True,
        compress_system_messages=True,
        min_tokens_to_compress=50,
        protect_recent=0
    )
    res = compress([{"role": "tool", "content": work_text}], model="claude-sonnet-4-5-20250929", config=cfg)
    compressed_text = res.messages[0].get("content", work_text) if res.messages else work_text
    applied = list(res.transforms_applied) if res.transforms_applied else []

    if isinstance(compressed_text, str) and compressed_text.startswith('"') and compressed_text.endswith('"'):
        try:
            unwrapped = json.loads(compressed_text)
            if isinstance(unwrapped, str):
                compressed_text = unwrapped
        except Exception:
            pass

    if is_hybrid_markdown and any(t.startswith("router:tabular") for t in applied):
        orig_headings = len(re.findall(r"^#{1,3}\\s+", raw, re.MULTILINE))
        new_headings = len(re.findall(r"^#{1,3}\\s+", compressed_text, re.MULTILINE))
        if new_headings < orig_headings:
            compressed_text = work_text
            applied = ["densify:markdown-sections-and-tables"]

    if not is_hybrid_markdown and (not applied or applied == ["router:noop"]) and len(raw) > 200:
        densified = densify_markdown(raw)
        if len(densified) < len(raw):
            compressed_text = densified
            applied.append("densify:markdown-hygiene")
    elif is_hybrid_markdown and len(work_text) < len(raw) and "densify:markdown-sections-and-tables" not in applied:
        applied.append("densify:markdown-sections-and-tables")

    print(json.dumps({
        "compressed": compressed_text.strip() + chr(10),
        "transforms": applied
    }, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"error": str(e), "compressed": raw, "transforms": []}))
`;

    const proc = spawn(
      existsSync(UV_HEADROOM_PYTHON) ? UV_HEADROOM_PYTHON : 'python3',
      ['-c', pythonScript],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(`Headroom compression failed (exit ${code}): ${stderr}`));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch {
        reject(new Error(`Failed to parse Headroom output: ${stdout || stderr}`));
      }
    });

    proc.stdin.write(rawContent);
    proc.stdin.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  let rawContent = '';
  const isJson = args.includes('--json');
  const isRaw = args.includes('--raw');
  let shouldSave = args.includes('--save') || args.includes('-s');
  const skipOmni = args.includes('--no-omni');

  let outputFile = null;
  const outArgIdx = args.indexOf('--output') !== -1 ? args.indexOf('--output') : args.indexOf('-o');
  if (outArgIdx !== -1 && args[outArgIdx + 1]) {
    outputFile = args[outArgIdx + 1];
    shouldSave = true;
  }

  const fileArg = args.find((a) => !a.startsWith('-') && existsSync(a));

  const textArgIdx = args.indexOf('--text');
  if (textArgIdx !== -1 && args[textArgIdx + 1]) {
    rawContent = args[textArgIdx + 1];
  } else if (fileArg) {
    rawContent = readFileSync(fileArg, 'utf-8');
  } else {
    rawContent = await readAllStdin();
  }

  if (fileArg && shouldSave && !outputFile) {
    const ext = path.extname(fileArg);
    const base = path.basename(fileArg, ext);
    const dir = path.dirname(fileArg);
    if (base.endsWith('.compressed')) {
      outputFile = fileArg;
    } else {
      outputFile = path.join(dir, `${base}.compressed${ext}`);
    }
  }

  if (!rawContent || !rawContent.trim()) {
    console.error('[HEADROOM] Error: No content provided via file, --text, or stdin.');
    process.exit(1);
  }

  try {
    const origTokens = countEstimatedTokens(rawContent);
    const hasCyrillic = /[\u0400-\u04FF]/.test(rawContent);

    let workingContent = rawContent;
    let didOmniTranslate = false;

    // If input contains Ukrainian/Cyrillic, delegate translation and distillation to OmniRoute
    // to achieve massive token reduction (English BPE density + removal of fluff)
    if (hasCyrillic && !skipOmni) {
      console.error(
        '[HEADROOM] Ukrainian text detected. Delegating translation & semantic distillation to OmniRoute...',
      );
      const title = fileArg ? path.basename(fileArg) : '';
      workingContent = await distillAndTranslateViaOmniRoute(workingContent, title);
      didOmniTranslate = true;
    }

    const result = await compressViaHeadroom(workingContent);

    if (result.error && !result.compressed) {
      console.error(`[HEADROOM] Compression error: ${result.error}`);
      process.exit(1);
    }

    const title = fileArg ? path.basename(fileArg, path.extname(fileArg)) : '';
    let finalCleaned = postProcessMarkdown(result.compressed, title);
    validateDefectIntegrity(rawContent, finalCleaned);

    const finalTokens = countEstimatedTokens(finalCleaned, false);
    const tokensSaved = Math.max(0, origTokens - finalTokens);
    const savingsPercent = Math.min(
      95,
      Math.max(0, Math.round((tokensSaved / origTokens) * 1000) / 10),
    );

    const finalResult = {
      compressed: finalCleaned,
      original_tokens: origTokens,
      compressed_tokens: finalTokens,
      tokens_saved: tokensSaved,
      savings_percent: savingsPercent,
      omni_distilled: didOmniTranslate,
      transforms: result.transforms || [],
    };

    if (outputFile) {
      const outDir = path.dirname(outputFile);
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }
      writeFileSync(outputFile, finalResult.compressed, 'utf-8');

      // Auto-format generated markdown with prettier if available
      try {
        await execFileAsync('npx', ['prettier', '--write', outputFile]);
      } catch {
        // Prettier formatting is best-effort
      }

      console.error(`[HEADROOM] Saved compressed output to: ${outputFile}`);
      console.error(
        `[HEADROOM] Tokens: ${origTokens} -> ${finalTokens} (-${savingsPercent}% saved: ${tokensSaved} tokens${
          didOmniTranslate ? ' via OmniRoute English distillation' : ''
        })`,
      );
      if (isJson) {
        console.log(JSON.stringify({ ...finalResult, outputFile }, null, 2));
      } else {
        console.log(outputFile);
      }
      return;
    }

    if (isJson) {
      console.log(JSON.stringify(finalResult, null, 2));
    } else if (isRaw) {
      process.stdout.write(finalResult.compressed);
    } else {
      console.error(
        `[HEADROOM] Tokens: ${origTokens} -> ${finalTokens} (-${savingsPercent}% saved: ${tokensSaved} tokens${
          didOmniTranslate ? ' via OmniRoute English distillation' : ''
        })`,
      );
      console.log(finalResult.compressed);
    }
  } catch (err) {
    console.error(`[HEADROOM] Error: ${err.message}`);
    process.exit(1);
  }
}

main();
