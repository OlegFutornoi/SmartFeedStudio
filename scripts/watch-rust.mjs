#!/usr/bin/env node

/**
 * SmartFeed Studio - Fast Rust Auto-Watcher for Desktop Client
 * Automatically triggers `cargo check` on any edit to Rust source files in apps/desktop/src-tauri.
 */

import { spawn } from 'node:child_process';
import { watch, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const TAURI_SRC_DIR = resolve('apps/desktop/src-tauri/src');
const TAURI_CARGO = resolve('apps/desktop/src-tauri/Cargo.toml');

if (!existsSync(TAURI_SRC_DIR)) {
  console.error(`[FAIL] [Watch:Rust] Directory not found: ${TAURI_SRC_DIR}`);
  process.exit(1);
}

let running = false;
let queued = false;
let debounceTimer = null;

function runCargoCheck(changedFile = '') {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  queued = false;

  const fileLabel = changedFile ? ` (triggered by ${relative(process.cwd(), changedFile)})` : '';
  console.log(`\n[INFO] [Watch:Rust] Running incremental cargo check${fileLabel}...`);

  const start = Date.now();
  const child = spawn('node', ['scripts/verify-rust.mjs'], { stdio: 'inherit' });

  child.on('close', (code) => {
    running = false;
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    if (code === 0) {
      console.log(`[PASS] [Watch:Rust] Check completed in ${duration}s. Watching for changes...`);
    } else {
      console.error(`[FAIL] [Watch:Rust] Check failed (exit code ${code}) in ${duration}s.`);
    }

    if (queued) {
      runCargoCheck();
    }
  });
}

function handleFileChange(filename) {
  if (!filename || (!filename.endsWith('.rs') && !filename.endsWith('.toml'))) {
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runCargoCheck(filename);
  }, 250);
}

console.log('[INFO] [Watch:Rust] Watching apps/desktop/src-tauri for Rust changes (*.rs, Cargo.toml)...');
runCargoCheck();

watch(TAURI_SRC_DIR, { recursive: true }, (_eventType, filename) => {
  handleFileChange(filename);
});

if (existsSync(TAURI_CARGO)) {
  watch(TAURI_CARGO, (_eventType, filename) => {
    handleFileChange(filename || 'Cargo.toml');
  });
}

