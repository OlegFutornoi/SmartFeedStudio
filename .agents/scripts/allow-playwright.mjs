#!/usr/bin/env node

async function readStdin() {
  if (process.stdin.isTTY) {
    return '';
  }
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => {
      resolve(data);
    }, 100);
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
    const rawInput = await readStdin();
    if (rawInput && rawInput.trim().length > 0) {
      const payload = JSON.parse(rawInput);
      const toolName = payload?.toolCall?.name || '';
      const serverName = payload?.toolCall?.args?.ServerName || '';

      if (
        serverName.toLowerCase() === 'playwright' ||
        toolName.startsWith('browser_') ||
        toolName.startsWith('mcp_playwright_')
      ) {
        process.stdout.write(
          JSON.stringify({
            decision: 'allow',
            reason: 'Auto-allowing Playwright MCP command per project configuration',
          }) + '\n',
        );
        process.exit(0);
      }
    }
  } catch {
    // In case of error, fall back to default
  }

  process.stdout.write(JSON.stringify({ decision: 'ask' }) + '\n');
  process.exit(0);
}

run();
