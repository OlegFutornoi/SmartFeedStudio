#!/usr/bin/env node

/**
 * OmniRoute Task Runner CLI
 * Executes prompts and delegations directly through multi-provider zero-cost AI fallback (Google AI Studio, Groq, OpenRouter).
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
const geminiApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '';
const geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
const groqApiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';
const groqBaseUrl = 'https://api.groq.com/openai/v1';
const openrouterApiKey = process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || '';
const openrouterBaseUrl = 'https://openrouter.ai/api/v1';
const defaultModel =
  process.env.AI_DEFAULT_MODEL || env.AI_DEFAULT_MODEL || 'gemini-3.8-flash';
const defaultFallbackModels = (
  process.env.AI_FALLBACK_MODELS ||
  env.AI_FALLBACK_MODELS ||
  'gemini-3.8-flash,groq/openai/gpt-oss-120b,groq/qwen/qwen3.8-27b,gemini-flash-latest,openrouter/nvidia/nemotron-3-ultra-550b-a55b:free,openrouter/openrouter/free'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

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
    userSpecifiedModel: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--model' && args[i + 1]) {
      options.model = args[++i];
      options.userSpecifiedModel = true;
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

  const candidateModels = [
    opts.model,
    ...defaultFallbackModels.filter((m) => m !== opts.model),
  ];

  let lastError = null;
  let finalContent = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModel = candidateModels[i];
    payload.model = currentModel;

    const isGeminiDirect = currentModel.startsWith('gemini') && geminiApiKey;
    const isGroqDirect = currentModel.startsWith('groq/') && groqApiKey;
    const isOpenRouter =
      (currentModel.startsWith('openrouter/') ||
        currentModel.includes('/') ||
        currentModel.endsWith(':free')) &&
      openrouterApiKey;

    let targetEndpoint = `${openrouterBaseUrl}/chat/completions`;
    let targetAuth = `Bearer ${openrouterApiKey}`;

    if (isGeminiDirect) {
      targetEndpoint = `${geminiBaseUrl}/chat/completions`;
      targetAuth = `Bearer ${geminiApiKey}`;
    } else if (isGroqDirect) {
      targetEndpoint = `${groqBaseUrl}/chat/completions`;
      targetAuth = `Bearer ${groqApiKey}`;
      payload.model = currentModel.replace(/^groq\//, '');
    } else if (isOpenRouter) {
      targetEndpoint = `${openrouterBaseUrl}/chat/completions`;
      targetAuth = `Bearer ${openrouterApiKey}`;
      if (currentModel === 'openrouter/openrouter/free' || currentModel === 'openrouter/free') {
        payload.model = 'openrouter/free';
      } else if (currentModel.startsWith('openrouter/')) {
        payload.model = currentModel.slice('openrouter/'.length);
      }
    }

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: targetAuth,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed?.error?.message || parsed?.error?.code || errorMsg;
        } catch {
          errorMsg = errorText.slice(0, 150);
        }

        const isRecoverable =
          response.status === 429 ||
          response.status === 503 ||
          response.status === 502 ||
          /rate[- ]limit|cooldown|cooling down|quota|overloaded/i.test(errorMsg);

        if (isRecoverable && i < candidateModels.length - 1) {
          console.warn(
            `[OmniRoute] Model ${currentModel} busy (${errorMsg}). Switching to fallback ${candidateModels[i + 1]}...`,
          );
          lastError = new Error(errorMsg);
          continue;
        }

        throw new Error(`OmniRoute error (${currentModel}): ${errorMsg}`);
      }

      const result = await response.json();
      if (result.error) {
        const errorMsg = result.error.message || result.error.code || 'Unknown error';
        if (i < candidateModels.length - 1) {
          console.warn(
            `[OmniRoute] Model ${currentModel} error (${errorMsg}). Switching to fallback ${candidateModels[i + 1]}...`,
          );
          lastError = new Error(errorMsg);
          continue;
        }
        throw new Error(`OmniRoute error (${currentModel}): ${errorMsg}`);
      }

      const choice = result.choices && result.choices[0];
      finalContent = choice?.message?.content || choice?.message?.reasoning_content || '';
      break;
    } catch (err) {
      lastError = err;
      if (i < candidateModels.length - 1) {
        console.warn(
          `[OmniRoute] ${currentModel} attempt failed: ${err.message}. Retrying next free model...`,
        );
      } else {
        throw err;
      }
    }
  }

  if (finalContent === null) {
    console.error('OmniRoute error: all candidate models failed.', lastError?.message);
    process.exit(1);
  }

  process.stdout.write(finalContent + '\n');
}

run().catch((err) => {
  console.error('OmniRoute dispatch failed:', err.message);
  process.exit(1);
});

