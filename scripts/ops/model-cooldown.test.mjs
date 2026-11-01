import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unlinkSync, existsSync } from 'node:fs';
import {
  computeCooldownDuration,
  loadCooldownState,
  saveCooldownState,
  recordModelFailure,
  recordModelSuccess,
  isModelAvailable,
  selectAvailableCandidateModels,
  resetCooldowns,
} from './model-cooldown-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_STATE_PATH = resolve(__dirname, '../../.temp/test-model-cooldowns.json');

function cleanup() {
  if (existsSync(TEST_STATE_PATH)) {
    unlinkSync(TEST_STATE_PATH);
  }
}

test('computeCooldownDuration maps HTTP codes to appropriate durations', () => {
  assert.equal(computeCooldownDuration(429, 'Rate limit'), 15 * 60 * 1000);
  assert.equal(computeCooldownDuration(503, 'High demand'), 10 * 60 * 1000);
  assert.equal(computeCooldownDuration(404, 'Not found'), 120 * 60 * 1000);
  assert.equal(computeCooldownDuration(401, 'Unauthorized'), 60 * 60 * 1000);
  assert.equal(computeCooldownDuration(null, 'fetch ETIMEDOUT'), 10 * 60 * 1000);
  assert.equal(computeCooldownDuration(500, 'Internal Server Error'), 5 * 60 * 1000);
  assert.equal(computeCooldownDuration(429, 'Limit reached. Please try again in 9s.'), 15000);
  assert.equal(computeCooldownDuration(429, 'Please try again in 25s.'), 28000);
});

test('recordModelFailure puts model into cooldown and saves state', () => {
  cleanup();
  recordModelFailure('test-model-1', 'Rate limit exceeded', 429, TEST_STATE_PATH);
  const state = loadCooldownState(TEST_STATE_PATH);

  assert.ok(state.models['test-model-1']);
  assert.equal(state.models['test-model-1'].status, 'cooldown');
  assert.equal(state.models['test-model-1'].statusCode, 429);
  assert.equal(state.models['test-model-1'].failureCount, 1);
  assert.equal(isModelAvailable('test-model-1', state), false);

  cleanup();
});

test('recordModelSuccess resets failure count and marks healthy', () => {
  cleanup();
  recordModelFailure('test-model-2', '503 Overloaded', 503, TEST_STATE_PATH);
  recordModelSuccess('test-model-2', TEST_STATE_PATH);

  const state = loadCooldownState(TEST_STATE_PATH);
  assert.equal(state.models['test-model-2'].status, 'healthy');
  assert.equal(state.models['test-model-2'].failureCount, 0);
  assert.equal(isModelAvailable('test-model-2', state), true);

  cleanup();
});

test('selectAvailableCandidateModels filters out cooling-down models', () => {
  cleanup();
  recordModelFailure('busy-model', 'Rate limit', 429, TEST_STATE_PATH);

  const candidates = ['busy-model', 'available-model-1', 'available-model-2'];
  const { available, coolingDown } = selectAvailableCandidateModels(candidates, TEST_STATE_PATH);

  assert.deepEqual(available, ['available-model-1', 'available-model-2']);
  assert.equal(coolingDown.length, 1);
  assert.equal(coolingDown[0].model, 'busy-model');

  cleanup();
});

test('selectAvailableCandidateModels re-queues earliest if all candidates are cooling down', () => {
  cleanup();
  const state = {
    models: {
      'model-a': { until: Date.now() + 50000, lastError: '429' },
      'model-b': { until: Date.now() + 10000, lastError: '503' },
    },
    updatedAt: new Date().toISOString(),
  };
  saveCooldownState(state, TEST_STATE_PATH);

  const { available } = selectAvailableCandidateModels(['model-a', 'model-b'], TEST_STATE_PATH);
  assert.equal(available.length, 1);
  assert.equal(available[0], 'model-b'); // earliest expiring

  cleanup();
});

test('selectAvailableCandidateModels prioritizes healthy models first', () => {
  cleanup();
  const state = {
    models: {
      'healthy-model': { status: 'healthy', failureCount: 0 },
    },
    updatedAt: new Date().toISOString(),
  };
  saveCooldownState(state, TEST_STATE_PATH);

  const { available } = selectAvailableCandidateModels(['unknown-model', 'healthy-model'], TEST_STATE_PATH);
  assert.deepEqual(available, ['healthy-model', 'unknown-model']);

  cleanup();
});

test('resetCooldowns clears all entries', () => {
  cleanup();
  recordModelFailure('model-x', 'Rate limit', 429, TEST_STATE_PATH);
  resetCooldowns(TEST_STATE_PATH);
  const state = loadCooldownState(TEST_STATE_PATH);
  assert.deepEqual(state.models, {});
  cleanup();
});

