#!/usr/bin/env node
import { execSync } from 'node:child_process';

// 1. Verify that cargo is available in PATH
try {
  execSync('cargo --version', { stdio: 'ignore' });
} catch {
  console.log('⚠️ [Verify] Cargo not found in PATH, skipping local Rust check (handled by GitHub Actions desktop CI).');
  process.exit(0);
}

// 2. On Linux, Tauri requires native GUI libraries (glib-2.0, WebKitGTK).
// In minimal Linux runners/containers (e.g. Docker CI or server without desktop dev packages),
// cargo check will fail with missing glib-2.0. In that case, cleanly skip.
if (process.platform === 'linux') {
  try {
    execSync("pkg-config --exists 'glib-2.0 >= 2.70'", { stdio: 'ignore' });
  } catch {
    console.log(
      '⚠️ [Verify] Linux system libraries (glib-2.0 / WebKitGTK) not installed on this runner. Skipping cargo check (runs in dedicated desktop build matrix with system packages installed).'
    );
    process.exit(0);
  }
}

// 3. Run cargo check to catch Rust syntax, struct, or dependency compilation errors
console.log('🦀 [Verify] Checking Rust/Tauri compilation (cargo check)...');
try {
  execSync('cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml', { stdio: 'inherit' });
  console.log('✅ [Verify] Rust compilation check passed.');
} catch (err) {
  console.error('❌ [Verify] Rust compilation failed! Please fix compiler errors in apps/desktop/src-tauri');
  process.exit(err && typeof err === 'object' && 'status' in err && typeof err.status === 'number' ? err.status : 1);
}
