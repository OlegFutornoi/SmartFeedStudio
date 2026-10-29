#!/usr/bin/env node

/**
 * OmniRoute Task Runner CLI
 * Executes prompts and delegations through local OmniRoute AI Gateway (port 20128).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '../../../../');

function loadEnv() {
  const envPath = resolve(rootDir, '.env');
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0) {
      env[key.trim()] = rest.join('=').trim().replace(/^["'](.*)["']$/, '$1');
    }
  }
  return env;
}

const env = loadEnv();
const headroomEnabled = process.env.HEADROOM_ENABLED !== 'false' && env.HEADROOM_ENABLED !== 'false';
const headroomUrl = process.env.HEADROOM_BASE_URL || env.HEADROOM_BASE_URL || 'http://localhost:8787/v1';
const omnirouteUrl = process.env.OMNIROUTE_BASE_URL || env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
const baseUrl = (headroomEnabled && headroomUrl ? headroomUrl : omnirouteUrl).replace(/\/+$/, '');
const apiKey = process.env.OMNIROUTE_API_KEY || env.OMNIROUTE_API_KEY || '';
const defaultModel = process.env.OMNIROUTE_DEFAULT_MODEL || env.OMNIROUTE_DEFAULT_MODEL || 'openrouter/deepseek/deepseek-chat';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    model: defaultModel,
    prompt: '',
    system: '',
    file: '',
    json: false,
    temperature: 0.2,
    maxTokens: 2048,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--model' && args[i + 1]) {
      options.model = args[++i];
    } else if (arg === '--prompt' && args[i + 1]) {
      options.prompt = args[++i];
    } else if (arg === '--system' && args[i + 1]) {
      options.system = args[++i];
    } else if (arg === '--file' && args[i + 1]) {
      options.file = args[++i];
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--temp' && args[i + 1]) {
      options.temperature = parseFloat(args[++i]);
    } else if (arg === '--max-tokens' && args[i + 1]) {
      options.maxTokens = parseInt(args[++i], 10);
    }
  }

  return options;
}

async function readStdin() {
  return new Promise((resolvePromise) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => { resolvePromise(data.trim()); });
  });
}

async function run() {
  const opts = parseArgs();

  let userPrompt = opts.prompt;
  if (!userPrompt && opts.file && existsSync(opts.file)) {
    userPrompt = readFileSync(opts.file, 'utf8');
  } else if (!userPrompt && !process.stdin.isTTY) {
    userPrompt = await readStdin();
  }

  if (!userPrompt) {
    console.error('Error: No prompt provided. Use --prompt "text", --file <path>, or pipe via stdin.');
    console.error('Example: pnpm ai:omni --prompt "Напиши план тестування..."');
    process.exit(1);
  }

  const messages = [];
  if (opts.system) {
    messages.push({ role: 'system', content: opts.system });
  }
  messages.push({ role: 'user', content: userPrompt });

  const payload = {
    model: opts.model,
    messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
  };

  if (opts.json) {
    payload.response_format = { type: 'json_object' };
  }

  const endpoint = `${baseUrl}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OmniRoute error (HTTP ${response.status}): ${errorText}`);
    process.exit(1);
  }

  const result = await response.json();
  const choice = result.choices && result.choices[0];
  const content = choice?.message?.content || choice?.message?.reasoning_content || '';

  process.stdout.write(content + '\n');
}

run().catch((err) => {
  console.error('OmniRoute dispatch failed:', err.message);
  process.exit(1);
});

