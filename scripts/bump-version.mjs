#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getCurrentVersion() {
  // 1. Primary source of truth: root package.json
  const rootPkgJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(rootPkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(rootPkgJsonPath, 'utf8'));
      if (pkg.version) return pkg.version;
    } catch {}
  }

  // 2. Fallback to tauri.conf.json
  const tauriConfPath = path.join(rootDir, 'apps/desktop/src-tauri/tauri.conf.json');
  if (fs.existsSync(tauriConfPath)) {
    try {
      const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
      if (conf.version) return conf.version;
    } catch {}
  }

  return '1.0.0';
}

function tagExists(tag) {
  try {
    const out = execSync(`git tag -l "${tag}"`, { cwd: rootDir, encoding: 'utf8' }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function calculateNextVersion(currentVersion, bumpType = 'patch') {
  const normalized = (bumpType || 'patch').toLowerCase().trim();

  // Explicit target version provided (e.g., "1.0.0")
  if (/^v?\d+\.\d+\.\d+/.test(normalized)) {
    return normalized.replace(/^v/, '');
  }

  if (normalized === 'reset') {
    return '1.0.0';
  }

  // If repo is at 1.0.0 and v1.0.0 tag hasn't been released yet, release 1.0.0
  if (currentVersion === '1.0.0' && !tagExists('v1.0.0')) {
    return '1.0.0';
  }

  const parts = currentVersion.split('.').map(Number);
  let major = parts[0] || 0;
  let minor = parts[1] || 0;
  let patch = parts[2] || 0;

  switch (normalized) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
    default:
      patch += 1;
      break;
  }

  return `${major}.${minor}.${patch}`;
}

const bumpArg = process.argv[2] || 'patch';
const currentVersion = getCurrentVersion();
const nextVersion = calculateNextVersion(currentVersion, bumpArg);

console.log(`Current version: v${currentVersion}`);
console.log(`Calculated next version: v${nextVersion} (bump: ${bumpArg})`);

// Run sync-desktop-version.mjs
execSync(`node "${path.join(__dirname, 'sync-desktop-version.mjs')}" "${nextVersion}"`, {
  cwd: rootDir,
  stdio: 'inherit',
});

// Print just the tag string for shell consumption if needed
console.log(`\nTARGET_TAG=v${nextVersion}`);
