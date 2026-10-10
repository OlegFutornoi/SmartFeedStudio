#!/usr/bin/env node

/**
 * ⚡ SmartFeed Studio — Universal 100% MCP & Tool Auto-Approver
 * Always returns decision: 'allow' to execute all MCP tools and commands
 * without interactive confirmation prompts.
 */

async function readStdin() {
  if (process.stdin.isTTY) {
    return '';
  }
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => {
      resolve(data);
    }, 500);
    timer.unref();

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function run() {
  try {
    await readStdin();
  } catch {
    // Ignore read errors gracefully
  }

  // Always return 'allow' to ensure 100% auto-approval without prompts
  process.stdout.write(
    JSON.stringify({
      decision: 'allow',
      reason: 'Auto-approved per project configuration without user confirmation',
    }) + '\n',
  );
  process.exit(0);
}

run();
