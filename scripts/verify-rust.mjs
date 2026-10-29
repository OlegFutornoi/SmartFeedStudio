#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// 1. Locate cargo binary (system PATH, ~/.cargo/bin/cargo, or Homebrew)
let cargoCmd = 'cargo';
try {
  execSync('cargo --version', { stdio: 'ignore' });
} catch {
  const homeCargo = join(homedir(), '.cargo', 'bin', 'cargo');
  const brewCargo = '/opt/homebrew/bin/cargo';
  if (existsSync(homeCargo)) {
    cargoCmd = homeCargo;
  } else if (existsSync(brewCargo)) {
    cargoCmd = brewCargo;
  } else {
    const isStrict = process.argv.includes('--strict');
    if (isStrict) {
      console.error('[FAIL] [Verify] Rust cargo toolchain is required for releases but not found in PATH or ~/.cargo/bin!');
      console.error('       Please run: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y');
      process.exit(1);
    }
    console.log('[WARN] [Verify] Cargo not found in PATH, skipping local Rust check (handled by GitHub Actions desktop CI).');
    process.exit(0);
  }
}

// 2. On Linux, Tauri requires native GUI libraries (glib-2.0, WebKitGTK).
// In minimal Linux runners/containers (e.g. Docker CI or server without desktop dev packages),
// cargo check will fail with missing glib-2.0. In that case, cleanly skip.
if (process.platform === 'linux') {
  try {
    execSync("pkg-config --exists 'glib-2.0 >= 2.70'", { stdio: 'ignore' });
  } catch {
    console.log(
      '[WARN] [Verify] Linux system libraries (glib-2.0 / WebKitGTK) not installed on this runner. Skipping cargo check.'
    );
    process.exit(0);
  }
}

// 3. Inspect if files were passed by lint-staged
const stagedFiles = process.argv.slice(2).filter((arg) => !arg.startsWith('--') && (arg.endsWith('.rs') || arg.endsWith('Cargo.toml')));
if (stagedFiles.length > 0) {
  console.log(`[INFO] [Verify] Checking Rust/Tauri compilation for ${stagedFiles.length} file(s)...`);
} else {
  console.log('[INFO] [Verify] Checking Rust/Tauri compilation (cargo check)...');
}

// 4. Run cargo check to catch Rust syntax, struct, or dependency compilation errors
try {
  execSync(`${cargoCmd} check --manifest-path apps/desktop/src-tauri/Cargo.toml`, { stdio: 'inherit' });
  console.log('[PASS] [Verify] Rust compilation check passed.');
} catch (err) {
  console.error('[FAIL] [Verify] Rust compilation failed! Please fix compiler errors in apps/desktop/src-tauri');
  process.exit(err && typeof err === 'object' && 'status' in err && typeof err.status === 'number' ? err.status : 1);
}
