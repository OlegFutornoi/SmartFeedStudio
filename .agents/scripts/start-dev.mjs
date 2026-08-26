#!/usr/bin/env node
import { execSync, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');

// ANSI escape codes for styling
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
  bgBlue: '\x1b[44m\x1b[37m',
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

function runSync(command, stepName, cwd = workspaceRoot) {
  try {
    execSync(command, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env },
    });
    return true;
  } catch {
    logError(`Command failed during ${stepName}: ${command}`);
    return false;
  }
}

async function main() {
  console.log(`
${colors.cyan}${colors.bright}================================================================${colors.reset}
${colors.bgBlue}${colors.bright}             🚀 SMARTFEED STUDIO DEV ENVIRONMENT              ${colors.reset}
${colors.cyan}${colors.bright}================================================================${colors.reset}
  `);

  // 1. Docker Infrastructure (PostgreSQL, Redis, MinIO)
  logStep('1/5', 'Starting Docker infrastructure (PostgreSQL, Redis, MinIO)...');
  try {
    execSync('docker info', { stdio: 'ignore' });
    const dockerUp = runSync('docker compose up -d', 'Docker compose up');
    if (dockerUp) {
      logSuccess('Docker containers are up and running (PostgreSQL 16, Redis 7, MinIO).');
    }
  } catch {
    logWarning('Docker daemon is not running or not installed. Skipping container startup.');
    logWarning('Make sure PostgreSQL (5432) and Redis (6379) are accessible locally.');
  }

  // 2. Build Shared Contracts (@smartfeed/shared)
  logStep('2/5', 'Building shared contracts & schemas (@smartfeed/shared)...');
  const sharedBuilt = runSync('pnpm --filter @smartfeed/shared build', 'Build shared package');
  if (sharedBuilt) {
    logSuccess('Shared contracts compiled successfully.');
  }

  // 3. Sync Database Schema & Prisma Client
  logStep('3/5', 'Syncing Database Schema & generating Prisma Client...');
  const prismaOk = runSync(
    'pnpm --filter @smartfeed/backend-api prisma:generate',
    'Prisma generate',
  );
  if (prismaOk) {
    logSuccess('Prisma client generated.');
  }

  // 4. Start Prisma Studio in background on port 5555
  logStep('4/5', 'Starting Prisma Studio GUI on port 5555...');
  let prismaStudioProcess = null;
  try {
    prismaStudioProcess = spawn(
      'pnpm',
      [
        '--filter',
        '@smartfeed/backend-api',
        'exec',
        'prisma',
        'studio',
        '--port',
        '5555',
        '--browser',
        'none',
      ],
      {
        cwd: workspaceRoot,
        stdio: 'ignore',
        env: { ...process.env },
      },
    );
    logSuccess('Prisma Studio GUI started on http://localhost:5555');
  } catch (err) {
    logWarning(`Could not start Prisma Studio automatically: ${err.message}`);
  }

  // 5. Print Dashboard Info
  console.log(`
${colors.magenta}${colors.bright}----------------------------------------------------------------${colors.reset}
${colors.bright}🌐 ACTIVE SERVICES & ACCESS ENDPOINTS:${colors.reset}
${colors.magenta}${colors.bright}----------------------------------------------------------------${colors.reset}
  • ${colors.bright}Backend API (NestJS CQRS):${colors.reset}   ${colors.cyan}http://localhost:4000/api${colors.reset}
  • ${colors.bright}Swagger OpenAPI Docs:${colors.reset}        ${colors.cyan}http://localhost:4000/api/docs${colors.reset}
  • ${colors.bright}Admin Web Portal (Next.js):${colors.reset}  ${colors.cyan}http://localhost:3000${colors.reset}
  • ${colors.bright}Desktop Client (Vite Dev):${colors.reset}   ${colors.cyan}http://localhost:1420${colors.reset}
  • ${colors.bright}Prisma Studio (GUI):${colors.reset}         ${colors.green}${colors.bright}http://localhost:5555${colors.reset} ${colors.dim}(Running in background)${colors.reset}
  • ${colors.bright}MinIO S3 Web Console:${colors.reset}        ${colors.cyan}http://localhost:9001${colors.reset} ${colors.dim}(minioadmin / minioadminpassword)${colors.reset}
  • ${colors.bright}Super Admin User:${colors.reset}            ${colors.yellow}admin@smartfeed.studio${colors.reset} / ${colors.yellow}AdminPassword123!${colors.reset}
${colors.magenta}${colors.bright}----------------------------------------------------------------${colors.reset}
  `);

  // 6. Start Turbo Dev Servers in Parallel
  logStep('5/5', 'Launching dev servers (Backend, Admin Portal, Desktop Vite, Shared Watcher)...');
  console.log(
    `${colors.dim}Press Ctrl+C at any time to stop all servers and Prisma Studio.${colors.reset}\n`,
  );

  const turboProcess = spawn('pnpm', ['turbo', 'run', 'dev', '--parallel'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' },
  });

  const cleanup = () => {
    console.log(
      `\n${colors.yellow}Shutting down all development servers & Prisma Studio...${colors.reset}`,
    );
    if (prismaStudioProcess && !prismaStudioProcess.killed) {
      try {
        prismaStudioProcess.kill('SIGINT');
      } catch {
        // ignore
      }
    }
    if (turboProcess && !turboProcess.killed) {
      try {
        turboProcess.kill('SIGINT');
      } catch {
        // ignore
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  turboProcess.on('exit', (code) => {
    if (prismaStudioProcess && !prismaStudioProcess.killed) {
      try {
        prismaStudioProcess.kill('SIGINT');
      } catch {
        // ignore
      }
    }
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  logError(`Unexpected error: ${err.message}`);
  process.exit(1);
});
