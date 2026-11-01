import { execFile, spawn } from 'node:child_process';
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
  'omniroute-query.mjs'
);

export function countEstimatedTokens(text, isCyrillic = false) {
  if (!text) return 0;
  const hasCyrillic = isCyrillic || /[\u0400-\u04FF]/.test(text);
  if (hasCyrillic) {
    return Math.ceil(text.length / 2.7);
  }
  return Math.ceil(text.length / 3.8);
}

export async function readAllStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export function postProcessMarkdown(text, defaultTitle = '') {
  let cleaned = text.trim();
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
    if (i === 0 && !line.startsWith('#') && line.startsWith('**') && line.endsWith('**')) {
      line = `# ${line.slice(2, -2).trim()}`;
    }
    if (/^#{1,6}\s+\*\*/.test(line)) {
      line = line.replace(/^(#{1,6}\s+)\*\*([^*]+)\*\*(.*)$/, '$1$2$3');
    }
    processed.push(line);
  }

  cleaned = processed.join('\n').trim();
  if (!cleaned.startsWith('#') && defaultTitle) {
    cleaned = `# ${defaultTitle}\n\n${cleaned}`;
  }
  return cleaned;
}

export function validateDefectIntegrity(rawText, compressedText) {
  const origDefects = [...new Set(rawText.match(/\[DEF-\d+\]/g) || [])];
  if (origDefects.length === 0) return true;

  const missing = origDefects.filter((def) => !compressedText.includes(def));
  if (missing.length > 0) {
    console.warn(`[HEADROOM] WARNING: Missing findings: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

export async function distillAndTranslateViaOmniRoute(text, contextTitle = '') {
  const systemPrompt =
    'You are a senior systems architect and token-optimization compiler for AI coding agents. Your job is to translate and compile Ukrainian architectural plans, specs, or task files into ultra-dense, actionable, technical English specifically optimized for LLM context windows. You MUST preserve 100% of all defect IDs without omitting a single one (e.g. DEF-01 through DEF-17 must all be explicitly included), exact file paths, line numbers, rule invariants (ARCH-xx, BE-xx, SEC-xx, DB-xx, UI-xx), concrete code snippets, and Definition of Done steps. Eliminate conversational fluff, narrative pleasantries, and duplicate prose. Start with a level-1 heading (# Title). Use compact bullet lists. Never use markdown tables. Never wrap the entire response in an outer ```markdown block. Never use emojis.';

  const userPrompt = contextTitle
    ? `Document Title: ${contextTitle}\n\nCompile and compress this specification into dense technical English for AI agents (preserve all defect IDs and paths):\n\n${text}`
    : `Compile and compress this specification into dense technical English for AI agents (preserve all defect IDs and paths):\n\n${text}`;

  try {
    const { stdout } = await execFileAsync(
      'node',
      [OMNIROUTE_SCRIPT, '--max-tokens', '4096', '--system', systemPrompt, '--prompt', userPrompt],
      { maxBuffer: 15 * 1024 * 1024 }
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

export async function compressViaHeadroom(rawContent) {
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
        comp_headings = len(re.findall(r"^#{1,3}\\s+", compressed_text, re.MULTILINE))
        if orig_headings > 3 and comp_headings <= 1:
            compressed_text = work_text

    print(json.dumps({
        "compressed": compressed_text,
        "transforms": applied,
        "tokens_before": res.tokens_before if hasattr(res, 'tokens_before') else 0,
        "tokens_after": res.tokens_after if hasattr(res, 'tokens_after') else 0
    }))
except Exception as e:
    print(json.dumps({"error": str(e), "compressed": raw}))
`;

    const py = spawn(UV_HEADROOM_PYTHON, ['-c', pythonScript]);
    let out = '';
    let err = '';

    py.stdout.on('data', (d) => (out += d));
    py.stderr.on('data', (d) => (err += d));

    py.on('close', (code) => {
      if (code !== 0 && !out) {
        return reject(new Error(`Headroom failed (${code}): ${err}`));
      }
      try {
        resolve(JSON.parse(out));
      } catch (parseErr) {
        resolve({ error: `JSON Parse failed: ${parseErr.message}`, raw_stdout: out });
      }
    });

    py.stdin.write(rawContent);
    py.stdin.end();
  });
}

