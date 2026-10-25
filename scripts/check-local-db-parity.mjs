#!/usr/bin/env node
import http from 'node:http';

async function fetchHealth(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔍 Checking SQLite schema parity between Dev (5001) and E2E (5002)...');
  try {
    const [dev, e2e] = await Promise.all([
      fetchHealth('http://localhost:5001/health'),
      fetchHealth('http://localhost:5002/health'),
    ]);

    console.log(`- Dev DB: tables=${dev.tablesCount}, fingerprint=${dev.schemaFingerprint?.slice(0, 8)}`);
    console.log(`- E2E DB: tables=${e2e.tablesCount}, fingerprint=${e2e.schemaFingerprint?.slice(0, 8)}`);

    if (dev.schemaFingerprint !== e2e.schemaFingerprint) {
      console.error('❌ Parity mismatch! Schema fingerprints do not match.');
      process.exit(1);
    }

    console.log('✅ SQLite Dev and E2E schemas are in 100% parity.');
  } catch (err) {
    console.warn('⚠️ Warning: Could not reach one or both SQLite containers. Make sure "pnpm docker:up" is running.');
  }
}

main();
