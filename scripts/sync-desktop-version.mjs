#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const rawVersion = process.argv[2] || process.env.GITHUB_REF_NAME || '1.16.2';
// Strip leading 'v' if present (e.g., 'v1.16.2' -> '1.16.2')
const version = rawVersion.replace(/^v/, '').trim();

if (!version) {
  console.error('❌ Error: Version argument is required.');
  process.exit(1);
}

// SemVer 2.0.0 validation regex
const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

if (!semverRegex.test(version)) {
  console.warn(`⚠️ Warning: "${version}" does not strictly match SemVer (MAJOR.MINOR.PATCH[-PRERELEASE]).`);
}

console.log(`🚀 Synchronizing Desktop App version to: ${version}`);

// 1. Update apps/desktop/src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'apps/desktop/src-tauri/tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${tauriConfPath} -> version: "${version}"`);
} else {
  console.warn(`⚠️ File not found: ${tauriConfPath}`);
}

// 2. Update apps/desktop/src-tauri/Cargo.toml
const cargoTomlPath = path.join(rootDir, 'apps/desktop/src-tauri/Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
  let cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
  // Match version = "..." under [package]
  cargoContent = cargoContent.replace(
    /(^\[package\][\s\S]*?\nversion\s*=\s*)"[^"]*"/m,
    `$1"${version}"`
  );
  fs.writeFileSync(cargoTomlPath, cargoContent, 'utf8');
  console.log(`✅ Updated ${cargoTomlPath} -> version = "${version}"`);
} else {
  console.warn(`⚠️ File not found: ${cargoTomlPath}`);
}

// 3. Update apps/desktop/package.json
const pkgJsonPath = path.join(rootDir, 'apps/desktop/package.json');
if (fs.existsSync(pkgJsonPath)) {
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  pkgJson.version = version;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
  console.log(`✅ Updated ${pkgJsonPath} -> version: "${version}"`);
} else {
  console.warn(`⚠️ File not found: ${pkgJsonPath}`);
}

console.log(`🎉 Version synchronization complete for v${version}`);
