#!/usr/bin/env node

/**
 * MCP Knowledge Cache Manager for SmartFeed Studio Agents
 * Caches documentation and research from Context7, Perplexity, Firecrawl, api-anything, and shadcn.
 * Stores strictly a single Headroom-compressed file (.compressed.md) per entry (zero duplicate files).
 * Delegates cache updating/synthesis to direct AI fallback (Google AI Studio, Groq, OpenRouter).
 *
 * Usage:
 *   node scripts/mcp-cache.mjs get <key>
 *   node scripts/mcp-cache.mjs search <keyword>
 *   node scripts/mcp-cache.mjs list
 *   cat << 'EOF' | node scripts/mcp-cache.mjs set <key> --source <mcp> --query "<q>" [--summary "<s>"] [--omni]
 *   node scripts/mcp-cache.mjs refresh <key> [--file <f>] [--prompt "<update-instructions>"]
 *   node scripts/mcp-cache.mjs delete <key>
 */

import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT_DIR, '.agents', 'cache', 'mcp');
const ENTRIES_DIR = path.join(CACHE_DIR, 'entries');
const INDEX_PATH = path.join(CACHE_DIR, 'index.json');
const HEADROOM_SCRIPT = path.join(ROOT_DIR, 'scripts', 'headroom-compress.mjs');
const OMNIROUTE_SCRIPT = path.join(
  ROOT_DIR,
  '.agents',
  'skills',
  'omniroute-delegation',
  'scripts',
  'omniroute-query.mjs'
);

function ensureCacheDirs() {
  if (!existsSync(ENTRIES_DIR)) {
    mkdirSync(ENTRIES_DIR, { recursive: true });
  }
  if (!existsSync(INDEX_PATH)) {
    writeFileSync(INDEX_PATH, JSON.stringify({ version: 1, entries: {} }, null, 2), 'utf-8');
  }
}

function loadIndex() {
  ensureCacheDirs();
  try {
    return JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  } catch (err) {
    console.warn(`[MCP_CACHE] Corrupt index.json, resetting: ${err.message}`);
    return { version: 1, entries: {} };
  }
}

function saveIndex(index) {
  ensureCacheDirs();
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf-8');
}

function toSafeSlug(key) {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getArg(args, flag, defaultVal = '') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

function sanitizeMarkdown(text, fallbackTitle = '') {
  let cleaned = text.trim();
  // Strip outer ```markdown ... ``` fence if an LLM wrapped the entire document
  if (/^```(?:markdown|md)?\s*\n/i.test(cleaned) && cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n?```$/, '').trim();
  }
  // Remove any legacy <!-- MCP_CACHE ... --> comment lines
  cleaned = cleaned.replace(/^<!--\s*MCP_CACHE[^>]*-->\s*\n?/gm, '').trim();
  // Ensure line 1 is a level-1 heading (# ...) for MD041 compliance
  if (/^#{2,6}\s+/.test(cleaned)) {
    cleaned = cleaned.replace(/^#{2,6}\s+/, '# ');
  } else if (fallbackTitle && !cleaned.startsWith('# ')) {
    cleaned = `# ${fallbackTitle}\n\n${cleaned}`;
  }
  return cleaned;
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8').trim();
}

async function synthesizeViaOmniRoute(rawText, query, customPrompt) {
  const systemPrompt =
    'You are a technical documentation synthesizer for AI coding agents. Distill raw MCP documentation or web search results into a dense, structured Markdown reference. Preserve all exact API signatures, code snippets, configuration flags, types, and constraints. Never wrap the entire response in an outer ```markdown block. Never use markdown tables (use compact bullet lists instead). Never use emojis.';
  const userPrompt = customPrompt
    ? `Topic/Query: ${query}\nUpdate Instruction: ${customPrompt}\n\nSource Material:\n${rawText}`
    : `Topic/Query: ${query}\n\nDistill and structure the following MCP output for cache storage:\n${rawText}`;

  try {
    const { stdout } = await execFileAsync(
      'node',
      [OMNIROUTE_SCRIPT, '--system', systemPrompt, '--prompt', userPrompt],
      { maxBuffer: 10 * 1024 * 1024 }
    );
    return sanitizeMarkdown(stdout) || rawText;
  } catch (err) {
    console.warn(`[MCP_CACHE] OmniRoute synthesis fallback (using raw content): ${err.message}`);
    return sanitizeMarkdown(rawText);
  }
}

async function compressInMemory(content) {
  return new Promise((resolve) => {
    const proc = spawn('node', [HEADROOM_SCRIPT, '--json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.on('close', () => {
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        resolve({
          compressed: content,
          original_tokens: Math.ceil(content.length / 3),
          compressed_tokens: Math.ceil(content.length / 3),
          savings_percent: 0,
        });
      }
    });
    proc.stdin.write(content);
    proc.stdin.end();
  });
}

async function handleSet(key, args, isRefresh = false) {
  if (!key) {
    console.error('[MCP_CACHE] Error: Missing cache key.');
    process.exit(1);
  }
  const index = loadIndex();
  const existing = index.entries[key] || {};
  const source = getArg(args, '--source', existing.source || 'mcp');
  const query = getArg(args, '--query', existing.query || key);
  const summary = getArg(args, '--summary', existing.summary || `Cached ${source} docs for ${key}`);
  const fileArg = getArg(args, '--file');
  const textArg = getArg(args, '--text');
  const promptArg = getArg(args, '--prompt');
  const useOmni = args.includes('--omni') || isRefresh;

  let content = textArg;
  if (!content && fileArg && existsSync(fileArg)) {
    content = readFileSync(fileArg, 'utf-8');
  } else if (!content) {
    content = await readStdin();
  }

  if (isRefresh && existing.file) {
    const prevPath = path.join(ROOT_DIR, existing.file);
    const prevContent = existsSync(prevPath) ? readFileSync(prevPath, 'utf-8') : '';
    content = content
      ? `Previous Cached Knowledge:\n${prevContent}\n\nNew Updated MCP Data:\n${content}`
      : prevContent;
  }

  if (!content) {
    console.error('[MCP_CACHE] Error: No content provided via stdin, --file, or --text.');
    process.exit(1);
  }

  content = sanitizeMarkdown(content);

  if (useOmni) {
    console.error(`[MCP_CACHE] Delegating cache synthesis/update for "${key}" to OmniRoute...`);
    content = await synthesizeViaOmniRoute(content, query, promptArg);
  }

  const compResult = await compressInMemory(content);
  const finalBody = sanitizeMarkdown(compResult?.compressed || content, summary || key);

  const slug = toSafeSlug(key);
  // Store strictly ONE single compressed file per entry (zero duplicate raw .md files)
  const legacyRawPath = path.join(ENTRIES_DIR, `${slug}.md`);
  if (existsSync(legacyRawPath)) {
    unlinkSync(legacyRawPath);
  }

  const compFilePath = path.join(ENTRIES_DIR, `${slug}.compressed.md`);
  writeFileSync(compFilePath, finalBody + '\n', 'utf-8');

  index.entries[key] = {
    key,
    source,
    query,
    summary,
    updatedAt: new Date().toISOString(),
    file: path.relative(ROOT_DIR, compFilePath),
    originalTokens: compResult?.original_tokens ?? Math.ceil(content.length / 3),
    compressedTokens: compResult?.compressed_tokens ?? Math.ceil(finalBody.length / 3),
    savingsPercent: compResult?.savings_percent ?? 0,
  };

  saveIndex(index);
  console.log(
    `[MCP_CACHE] ${isRefresh ? 'REFRESHED' : 'STORED'}: "${key}" -> ${index.entries[key].file} (${index.entries[key].compressedTokens} tokens)`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const target = args[1];

  if (!command || command === 'list') {
    const index = loadIndex();
    const keys = Object.keys(index.entries);
    if (keys.length === 0) {
      console.log('[MCP_CACHE] Cache is empty.');
      return;
    }
    console.log(`[MCP_CACHE] Total cached entries: ${keys.length}`);
    for (const k of keys) {
      const e = index.entries[k];
      console.log(
        `  - ${e.key} [${e.source}] (${e.compressedTokens} tok, updated: ${e.updatedAt.slice(0, 10)}) -> ${e.file}`
      );
    }
    return;
  }

  if (command === 'get') {
    const index = loadIndex();
    const entry = index.entries[target];
    if (!entry) {
      console.error(`[MCP_CACHE] MISS: "${target}" not found in cache.`);
      process.exit(1);
    }
    const targetFile = path.join(ROOT_DIR, entry.file);
    if (!existsSync(targetFile)) {
      console.error(`[MCP_CACHE] MISS: File missing on disk for "${target}".`);
      process.exit(1);
    }
    console.error(
      `[MCP_CACHE] HIT: "${target}" (source: ${entry.source}, updated: ${entry.updatedAt}, tokens: ${entry.compressedTokens})`
    );
    process.stdout.write(readFileSync(targetFile, 'utf-8'));
    return;
  }

  if (command === 'search') {
    const term = (target || '').toLowerCase();
    const index = loadIndex();
    const matches = Object.values(index.entries).filter(
      (e) =>
        e.key.toLowerCase().includes(term) ||
        e.source.toLowerCase().includes(term) ||
        e.query.toLowerCase().includes(term) ||
        e.summary.toLowerCase().includes(term)
    );
    console.log(JSON.stringify(matches, null, 2));
    return;
  }

  if (command === 'set') {
    await handleSet(target, args.slice(2), false);
    return;
  }

  if (command === 'refresh') {
    await handleSet(target, args.slice(2), true);
    return;
  }

  if (command === 'delete') {
    const index = loadIndex();
    const entry = index.entries[target];
    if (entry) {
      if (entry.file && existsSync(path.join(ROOT_DIR, entry.file))) {
        unlinkSync(path.join(ROOT_DIR, entry.file));
      }
      delete index.entries[target];
      saveIndex(index);
      console.log(`[MCP_CACHE] DELETED: "${target}"`);
    }
    return;
  }

  console.error(`[MCP_CACHE] Unknown command: ${command}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(`[MCP_CACHE] Fatal error: ${err.message}`);
  process.exit(1);
});
