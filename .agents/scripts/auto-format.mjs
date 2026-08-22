#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');
const prettierBin = path.join(workspaceRoot, 'node_modules/.bin/prettier');

const SUPPORTED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.css',
  '.scss',
  '.html',
  '.prisma',
]);

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

function formatFiles(filePaths) {
  if (!fs.existsSync(prettierBin) || filePaths.length === 0) {
    return;
  }

  const validFiles = filePaths.filter((file) => {
    try {
      const fullPath = path.isAbsolute(file) ? file : path.join(workspaceRoot, file);
      if (!fs.existsSync(fullPath)) return false;
      const ext = path.extname(fullPath).toLowerCase();
      return SUPPORTED_EXTENSIONS.has(ext);
    } catch {
      return false;
    }
  });

  if (validFiles.length === 0) return;

  try {
    const quotedFiles = validFiles.map((f) => `"${f}"`).join(' ');
    execSync(`"${prettierBin}" --write --ignore-unknown ${quotedFiles}`, {
      cwd: workspaceRoot,
      stdio: 'ignore',
      env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' },
    });
  } catch {
    // Ignore formatting errors gracefully
  }
}

async function run() {
  try {
    const rawInput = await readStdin();
    const filesToFormat = new Set();

    if (rawInput && rawInput.trim().length > 0) {
      try {
        const payload = JSON.parse(rawInput);
        const targetFile =
          payload?.toolCall?.args?.TargetFile ||
          payload?.toolCallArgs?.TargetFile ||
          payload?.targetFile;

        if (targetFile && typeof targetFile === 'string') {
          filesToFormat.add(targetFile);
        }
      } catch {
        // Not JSON, continue to git status check
      }
    }

    // Also check modified/untracked files via git status
    try {
      const gitStatusOut = execSync('git status --porcelain', {
        cwd: workspaceRoot,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' },
      });

      const lines = gitStatusOut.split('\n');
      for (const line of lines) {
        if (!line || line.trim().length < 3) continue;
        const filePath = line.slice(3).trim();
        if (filePath && !filePath.endsWith('/')) {
          filesToFormat.add(path.resolve(workspaceRoot, filePath));
        }
      }
    } catch {
      // Git command failed, ignore
    }

    if (filesToFormat.size > 0) {
      formatFiles(Array.from(filesToFormat));
    }
  } catch {
    // Fail silently to never disrupt agent lifecycle
  } finally {
    // Always return empty JSON object required by PostToolUse hook contract
    process.stdout.write('{}\n');
    process.exit(0);
  }
}

run();
