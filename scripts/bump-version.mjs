#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getCurrentVersion() {
  try {
    const gitTag = execSync('git tag -l --sort=-v:refname', { cwd: rootDir, encoding: 'utf8' })
      .trim()
      .split('\n')[0];
    if (gitTag && /^v?\d+\.\d+\.\d+/.test(gitTag)) {
      return gitTag.replace(/^v/, '').trim();
    }
  } catch {
    // ignore git error
  }

  // Fallback to tauri.conf.json
  const tauriConfPath = path.join(rootDir, 'apps/desktop/src-tauri/tauri.conf.json');
  if (fs.existsSync(tauriConfPath)) {
    const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    if (conf.version) return conf.version;
  }

  return '1.0.0';
}

function calculateNextVersion(currentVersion, bumpType = 'patch') {
  const parts = currentVersion.split('.').map(Number);
  let major = parts[0] || 0;
  let minor = parts[1] || 0;
  let patch = parts[2] || 0;

  const normalized = (bumpType || 'patch').toLowerCase().trim();

  if (/^v?\d+\.\d+\.\d+/.test(normalized)) {
    return normalized.replace(/^v/, '');
  }

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
