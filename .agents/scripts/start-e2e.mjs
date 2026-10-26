#!/usr/bin/env node
import { execSync, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  bgMagenta: '\x1b[45m\x1b[37m',
};

function logStep(step, message) {
  console.log(
    `\n${colors.cyan}${colors.bright}[${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`,
  );
}

function logSuccess(message) {
  console.log(`  ${colors.green}✔${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`  ${colors.red}✖${colors.reset} ${message}`);
}

function runSync(command, stepName, extraEnv = {}) {
  try {
    execSync(command, {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
    });
    return true;
  } catch {
    logError(`Command failed during ${stepName}: ${command}`);
    return false;
  }
}

async function main() {
  console.log(`
${colors.magenta}${colors.bright}================================================================${colors.reset}
${colors.bgMagenta}${colors.bright}          🧪 SMARTFEED STUDIO E2E TEST ENVIRONMENT              ${colors.reset}
${colors.magenta}${colors.bright}================================================================${colors.reset}
  `);

  // 1. Free E2E Ports (1421, 3001, 4001, 5002, 5433)
  logStep('1/6', 'Freeing isolated E2E ports (1421, 3001, 4001, 5002, 5433)...');
  runSync('node scripts/free-dev-ports.mjs 1421 3001 4001 5002 5433', 'Free E2E ports');
  logSuccess('Ports 1421, 3001, 4001, 5002, 5433 freed.');

  // 2. Start Docker Containers for E2E
  logStep('2/6', 'Starting Docker E2E infrastructure (PostgreSQL E2E, SQLite E2E, Redis, MinIO, Mailpit)...');
  try {
    execSync('docker info', { stdio: 'ignore' });
    const dockerOk = runSync(
      'docker compose up -d postgres-e2e sqlite-dev-e2e redis minio minio-init mailpit',
      'Start Docker E2E containers',
    );
    if (dockerOk) {
      logSuccess('Docker E2E containers running:');
      console.log(`     • PostgreSQL E2E: port 5433 (RAM tmpfs: smartfeed_test_db)`);
      console.log(`     • SQLite E2E:     port 5002 (RAM tmpfs: smartfeed-e2e.db)`);
      console.log(`     • Redis:          port 6379 (Isolated DB 1 for E2E queues)`);
      console.log(`     • Mailpit:        port 1025 (SMTP) / 8025 (Web UI & REST API)`);
    }
  } catch {
    logError('Docker daemon is not running! Please start Docker Desktop first.');
    process.exit(1);
  }

  // 3. Build Shared Contracts (@smartfeed/shared)
  logStep('3/6', 'Building shared contracts & schemas (@smartfeed/shared)...');
  const sharedBuilt = runSync('pnpm --filter @smartfeed/shared build', 'Build shared package');
  if (sharedBuilt) {
    logSuccess('Shared contracts compiled successfully.');
  }

  // 4. Synchronize E2E Databases (PostgreSQL 5433 + SQLite 5002)
  logStep('4/6', 'Synchronizing PostgreSQL E2E schema and verifying SQLite parity...');
  const dbSynced = runSync('node scripts/sync-server-e2e-db.mjs', 'Sync PostgreSQL E2E DB');
  if (!dbSynced) {
    logError('Failed to synchronize E2E PostgreSQL database on port 5433.');
    process.exit(1);
  }
  runSync('node scripts/check-local-db-parity.mjs', 'Check SQLite Parity');

  // 5. Spawn E2E Parallel Services
  logStep('5/6', 'Starting E2E server backend, admin portal, and desktop dev server...');

  const processes = [];

  // 5.1 Backend API on port 4001
  const backendEnv = {
    ...process.env,
    PORT: '4001',
    DATABASE_URL: 'postgresql://postgres:postgrespassword@localhost:5433/smartfeed_test_db?schema=public',
    REDIS_DB: '1',
    CORS_ORIGIN: 'http://localhost:3001,http://127.0.0.1:3001,http://localhost:1421,http://127.0.0.1:1421',
    FORCE_COLOR: 'true',
  };

  const backendProc = spawn('pnpm', ['--filter', '@smartfeed/backend-api', 'dev'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: backendEnv,
  });
  processes.push(backendProc);

  // 5.2 Admin Web Portal on port 3001
  const adminEnv = {
    ...process.env,
    PORT: '3001',
    NEXT_PUBLIC_API_URL: 'http://localhost:4001/api',
    FORCE_COLOR: 'true',
  };

  const adminProc = spawn('pnpm', ['--filter', '@smartfeed/admin-portal', 'exec', 'next', 'dev', '-p', '3001'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: adminEnv,
  });
  processes.push(adminProc);

  // 5.3 Desktop Client on port 1421
  const desktopEnv = {
    ...process.env,
    VITE_LOCAL_DB_URL: 'http://localhost:5002',
    FORCE_COLOR: 'true',
  };

  const desktopProc = spawn('pnpm', ['--filter', '@smartfeed/desktop', 'dev:e2e'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: desktopEnv,
  });
  processes.push(desktopProc);

  // 6. Print Dashboard Info
  console.log(`
${colors.cyan}${colors.bright}----------------------------------------------------------------${colors.reset}
${colors.bright}🧪 ACTIVE E2E TEST ENDPOINTS & SERVICES:${colors.reset}
${colors.cyan}${colors.bright}----------------------------------------------------------------${colors.reset}
  • ${colors.bright}Backend API (E2E NestJS):${colors.reset}    ${colors.cyan}http://localhost:4001/api${colors.reset}
  • ${colors.bright}Swagger OpenAPI Docs:${colors.reset}        ${colors.cyan}http://localhost:4001/api/docs${colors.reset}
  • ${colors.bright}Admin Web Portal (E2E):${colors.reset}      ${colors.cyan}http://localhost:3001${colors.reset}
  • ${colors.bright}Desktop Client (E2E Vite):${colors.reset}   ${colors.cyan}http://localhost:1421${colors.reset}
  • ${colors.bright}PostgreSQL E2E DB (tmpfs):${colors.reset}   ${colors.green}localhost:5433/smartfeed_test_db${colors.reset}
  • ${colors.bright}SQLite E2E Server (tmpfs):${colors.reset}   ${colors.green}http://localhost:5002${colors.reset}
  • ${colors.bright}Mailpit (Email capture):${colors.reset}     ${colors.green}http://localhost:8025${colors.reset} ${colors.dim}(REST API: /api/v2/messages)${colors.reset}
  • ${colors.bright}Admin Credentials:${colors.reset}           ${colors.yellow}admin@smartfeed.local${colors.reset} / ${colors.yellow}adminpassword${colors.reset}
${colors.cyan}${colors.bright}----------------------------------------------------------------${colors.reset}

${colors.green}${colors.bright}🚀 E2E Environment is LIVE!${colors.reset} Open another terminal to run tests:
  • ${colors.bright}pnpm e2e${colors.reset}                 - Run all E2E tests
  • ${colors.bright}pnpm e2e:ui${colors.reset}              - Open interactive Playwright UI Mode
  • ${colors.bright}pnpm e2e:server:backend${colors.reset}  - Run Server Backend API tests
  • ${colors.bright}pnpm e2e:server:admin${colors.reset}    - Run Server Admin Portal UI tests
  • ${colors.bright}pnpm e2e:local${colors.reset}           - Run Local SQLite & Desktop tests

${colors.dim}Press Ctrl+C at any time to stop all E2E servers.${colors.reset}
  `);

  const cleanup = () => {
    console.log(`\n${colors.yellow}Shutting down all E2E test servers...${colors.reset}`);
    for (const proc of processes) {
      if (proc && !proc.killed) {
        try {
          proc.kill('SIGINT');
        } catch {
          // ignore
        }
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  logError(`Unexpected error: ${err.message}`);
  process.exit(1);
});
