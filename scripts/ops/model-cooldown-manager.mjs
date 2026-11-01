#!/usr/bin/env node

/**
 * model-cooldown-manager.mjs
 * Tracks rate-limits, quotas, timeouts, and cooldown states for AI models across providers.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '../..');
export const DEFAULT_STATE_PATH = resolve(
  REPO_ROOT,
  '.agents/state/model-cooldowns.json'
);

const COOLDOWN_DURATIONS = {
  RATE_LIMIT_429: 15 * 60 * 1000,
  OVERLOAD_503: 10 * 60 * 1000,
  NOT_FOUND_404: 120 * 60 * 1000,
  AUTH_QUOTA_40X: 60 * 60 * 1000,
  TIMEOUT: 10 * 60 * 1000,
  DEFAULT: 5 * 60 * 1000,
};

export function computeCooldownDuration(statusCode, errorMessage = '') {
  const msg = String(errorMessage).toLowerCase();

  const msMatch = msg.match(/try again in (\d+(?:\.\d+)?)ms/i);
  if (msMatch) {
    const ms = Math.ceil(parseFloat(msMatch[1]));
    return Math.max(1000, ms + 500);
  }

  const retryMatch = msg.match(/try again in (?:(\d+)m)?(\d+(?:\.\d+)?)s/i);
  if (retryMatch) {
    const minutes = retryMatch[1] ? parseInt(retryMatch[1], 10) : 0;
    const seconds = Math.ceil(parseFloat(retryMatch[2]));
    const totalSeconds = minutes * 60 + seconds;
    return Math.max(15000, (totalSeconds + 3) * 1000);
  }

  if (/free-models-per-day|daily limit/i.test(msg)) {
    return 86400000; // 24 hours
  }
  if (statusCode === 429 || /rate[- ]limit|too many requests/i.test(msg)) {
    return COOLDOWN_DURATIONS.RATE_LIMIT_429;
  }
  if (
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504 ||
    /high demand|overloaded|unavailable|spikes in demand/i.test(msg)
  ) {
    return COOLDOWN_DURATIONS.OVERLOAD_503;
  }
  if (statusCode === 404 || /no longer available|not exist/i.test(msg)) {
    return COOLDOWN_DURATIONS.NOT_FOUND_404;
  }
  if (
    statusCode === 401 ||
    statusCode === 402 ||
    statusCode === 403 ||
    /quota|payment required|insufficient credits|disabled/i.test(msg)
  ) {
    return COOLDOWN_DURATIONS.AUTH_QUOTA_40X;
  }
  if (/timeout|aborted|etimedout/i.test(msg)) {
    return COOLDOWN_DURATIONS.TIMEOUT;
  }
  return COOLDOWN_DURATIONS.DEFAULT;
}

export function loadCooldownState(statePath = DEFAULT_STATE_PATH) {
  if (!existsSync(statePath)) {
    return { models: {}, updatedAt: null };
  }
  try {
    const raw = readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      models: parsed.models && typeof parsed.models === 'object' ? parsed.models : {},
      updatedAt: parsed.updatedAt || null,
    };
  } catch (err) {
    console.warn(`[WARN] Failed to parse model cooldown state: ${err.message}. Initializing empty.`);
    return { models: {}, updatedAt: null };
  }
}

export function saveCooldownState(state, statePath = DEFAULT_STATE_PATH) {
  try {
    const dir = dirname(statePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const data = {
      models: state.models || {},
      updatedAt: new Date().toISOString(),
    };
    writeFileSync(statePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.warn(`[WARN] Failed to save model cooldown state: ${err.message}`);
  }
}

export function isModelAvailable(modelId, state) {
  const record = state?.models?.[modelId];
  if (!record || !record.until) {
    return true;
  }
  return Date.now() >= record.until;
}

export function recordModelFailure(
  modelId,
  errorMessage = '',
  statusCode = null,
  statePath = DEFAULT_STATE_PATH
) {
  const state = loadCooldownState(statePath);
  const now = Date.now();
  const duration = computeCooldownDuration(statusCode, errorMessage);
  const until = now + duration;
  const prevRecord = state.models[modelId] || {};
  const failureCount = (prevRecord.failureCount || 0) + 1;

  state.models[modelId] = {
    status: 'cooldown',
    statusCode: statusCode || null,
    until,
    untilIso: new Date(until).toISOString(),
    durationMs: duration,
    lastError: String(errorMessage).slice(0, 300),
    lastAttempt: new Date(now).toISOString(),
    failureCount,
  };

  saveCooldownState(state, statePath);
  return { duration, until };
}

export function recordModelSuccess(modelId, statePath = DEFAULT_STATE_PATH) {
  const state = loadCooldownState(statePath);
  state.models[modelId] = {
    status: 'healthy',
    lastSuccess: new Date().toISOString(),
    failureCount: 0,
  };
  saveCooldownState(state, statePath);
}

export function selectAvailableCandidateModels(candidateModels, statePath = DEFAULT_STATE_PATH) {
  const state = loadCooldownState(statePath);
  const available = [];
  const coolingDown = [];

  for (const model of candidateModels) {
    if (isModelAvailable(model, state)) {
      available.push(model);
    } else {
      coolingDown.push({
        model,
        until: state.models[model].until,
        untilIso: state.models[model].untilIso,
        lastError: state.models[model].lastError,
      });
    }
  }

  if (available.length === 0 && candidateModels.length > 0) {
    coolingDown.sort((a, b) => (a.until || 0) - (b.until || 0));
    console.warn(
      `[WARN] All ${candidateModels.length} candidate models are cooling down. Re-queueing earliest candidate: ${coolingDown[0].model}`
    );
    available.push(coolingDown[0].model);
  } else {
    available.sort((a, b) => {
      const aHealthy = state.models[a]?.status === 'healthy' ? 1 : 0;
      const bHealthy = state.models[b]?.status === 'healthy' ? 1 : 0;
      return bHealthy - aHealthy;
    });
  }

  return { available, coolingDown };
}

export function resetCooldowns(statePath = DEFAULT_STATE_PATH) {
  const state = { models: {}, updatedAt: new Date().toISOString() };
  saveCooldownState(state, statePath);
  return state;
}

export function formatModelStatusReport(statePath = DEFAULT_STATE_PATH) {
  const state = loadCooldownState(statePath);
  const models = state.models || {};
  const entries = Object.entries(models);
  const now = Date.now();

  const lines = [
    '# AI Model Cooldown Status Registry',
    `Updated: ${state.updatedAt || 'Never'}`,
    `Tracked models: ${entries.length}`,
    '',
  ];

  if (entries.length === 0) {
    lines.push('[INFO] No model cooldowns recorded. All models ready.');
    return lines.join('\n');
  }

  for (const [modelId, info] of entries) {
    const isAvail = !info.until || now >= info.until;
    const remainingSec = info.until ? Math.max(0, Math.round((info.until - now) / 1000)) : 0;
    const badge = isAvail ? '[HEALTHY]' : `[COOLDOWN ${remainingSec}s]`;
    lines.push(`- ${badge} \`${modelId}\``);
    if (!isAvail) {
      lines.push(`  Expires: ${info.untilIso} | Error: ${info.lastError || 'N/A'}`);
    } else if (info.lastSuccess) {
      lines.push(`  Last success: ${info.lastSuccess}`);
    }
  }

  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  const arg = process.argv[2];
  if (arg === '--reset') {
    resetCooldowns();
    console.log('[PASS] Model cooldown registry reset.');
    process.exit(0);
  }
  console.log(formatModelStatusReport());
}

