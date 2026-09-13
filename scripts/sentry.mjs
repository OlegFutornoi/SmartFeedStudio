#!/usr/bin/env node

/**
 * Sentry CLI helper for SmartFeed Studio
 * Usage:
 *   node scripts/sentry.mjs [list] [--query "..."] [--limit 10]
 *   node scripts/sentry.mjs issue <issue_id>
 */

import fs from 'node:fs';
import path from 'node:path';

// Automatically load .env if present
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_URL = process.env.SENTRY_URL || 'https://de.sentry.io';

if (!SENTRY_AUTH_TOKEN) {
  console.error('❌ Error: SENTRY_AUTH_TOKEN is not set in environment or .env file.');
  process.exit(1);
}

async function sentryFetch(path) {
  const url = `${SENTRY_URL.replace(/\/$/, '')}/api/0/${path.replace(/^\//, '')}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SENTRY_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentry API HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function listIssues(query = '', limit = 15) {
  const orgs = await sentryFetch('organizations/');
  if (!orgs || orgs.length === 0) {
    console.log('No Sentry organizations found for this token.');
    return;
  }

  const orgSlug = orgs[0].slug;
  console.log(`\n🔍 Sentry Organization: [${orgSlug}] (${SENTRY_URL})`);

  const qs = new URLSearchParams();
  if (query) qs.append('query', query);
  qs.append('limit', String(limit));

  const issues = await sentryFetch(`organizations/${orgSlug}/issues/?${qs.toString()}`);
  if (!issues || issues.length === 0) {
    console.log('✅ No issues found matching query.');
    return;
  }

  console.log(`Found ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    const statusIcon = issue.status === 'unresolved' ? '🔴' : '🟢';
    console.log(`${statusIcon} #${issue.id} [${issue.level?.toUpperCase() || 'ERROR'}] (${issue.count} events)`);
    console.log(`   Title: ${issue.title}`);
    console.log(`   Culprit: ${issue.culprit || 'N/A'}`);
    console.log(`   Last Seen: ${issue.lastSeen}`);
    console.log(`   URL: ${issue.permalink}`);
    console.log('');
  }
}

async function getIssueDetails(issueId) {
  console.log(`\n🔍 Fetching issue #${issueId}...`);
  const issue = await sentryFetch(`issues/${issueId}/`);
  const hashes = await sentryFetch(`issues/${issueId}/hashes/`);

  console.log(`\n======================================================`);
  console.log(`Title:    ${issue.title}`);
  console.log(`ID:       ${issue.id}`);
  console.log(`Status:   ${issue.status}`);
  console.log(`Level:    ${issue.level}`);
  console.log(`Events:   ${issue.count}`);
  console.log(`First:    ${issue.firstSeen}`);
  console.log(`Last:     ${issue.lastSeen}`);
  console.log(`URL:      ${issue.permalink}`);
  console.log(`======================================================\n`);

  if (hashes && hashes.length > 0 && hashes[0].latestEvent) {
    const event = hashes[0].latestEvent;
    const entries = event.entries || [];
    for (const entry of entries) {
      if (entry.type === 'exception') {
        const values = entry.data?.values || [];
        for (const exc of values) {
          console.log(`❌ Exception: ${exc.type}: ${exc.value}\n`);
          if (exc.stacktrace?.frames) {
            console.log('Stacktrace:');
            for (const frame of exc.stacktrace.frames) {
              console.log(`  at ${frame.function || '?'} (${frame.filename}:${frame.lineNo})`);
              if (frame.context) {
                for (const line of frame.context) {
                  console.log(`     ${line[0] === frame.lineNo ? '>' : ' '} ${line[1]}`);
                }
              }
            }
          }
        }
      }
    }
  } else {
    console.log('No event stacktrace available.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  try {
    if (command === 'list') {
      let query = '';
      let limit = 15;
      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--query' && args[i + 1]) query = args[++i];
        if (args[i] === '--limit' && args[i + 1]) limit = parseInt(args[++i], 10);
      }
      await listIssues(query, limit);
    } else if (command === 'issue' || /^\d+$/.test(command)) {
      const id = command === 'issue' ? args[1] : command;
      if (!id) {
        console.error('Error: issue ID required. Example: node scripts/sentry.mjs issue 12345');
        process.exit(1);
      }
      await getIssueDetails(id);
    } else {
      console.log(`Usage:`);
      console.log(`  node scripts/sentry.mjs list [--query "..."] [--limit 15]`);
      console.log(`  node scripts/sentry.mjs issue <issue_id>`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
