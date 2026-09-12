#!/usr/bin/env node
const { execSync } = require('child_process');

try {
  execSync('cargo --version', { stdio: 'ignore' });
  console.log('🦀 [Verify] Checking Rust/Tauri compilation (cargo check)...');
  execSync('cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml', { stdio: 'inherit' });
  console.log('✅ [Verify] Rust compilation check passed.');
} catch (err) {
  if (err.status !== undefined && err.status !== 127) {
    console.error('❌ [Verify] Rust compilation failed! Please fix compiler errors in apps/desktop/src-tauri');
    process.exit(err.status || 1);
  }
  console.log('⚠️ [Verify] Cargo not found in PATH, skipping local Rust check (verified in GitHub Actions CI)');
}
