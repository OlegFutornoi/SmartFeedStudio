#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

const E2E_DATABASE_URL =
  process.env.E2E_TEST_DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5433/smartfeed_test_db?schema=public';

async function main() {
  console.log(`\n${colors.cyan}${colors.bright}🔄 [E2E DB Sync] Synchronizing PostgreSQL E2E database (port 5433)...${colors.reset}`);

  const adminEmail = process.env.E2E_SUPERADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.E2E_SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  const adminName = process.env.E2E_SUPERADMIN_NAME || process.env.ADMIN_NAME;

  const env = {
    ...process.env,
    DATABASE_URL: E2E_DATABASE_URL,
    ...(adminEmail ? { ADMIN_EMAIL: adminEmail } : {}),
    ...(adminPassword ? { ADMIN_PASSWORD: adminPassword } : {}),
    ...(adminName ? { ADMIN_NAME: adminName } : {}),
  };

  try {
    // 1. Prisma Migrate Deploy
    console.log(`  ${colors.bright}• Applying Prisma migrations to E2E PostgreSQL (port 5433)...${colors.reset}`);
    execSync('pnpm --filter @smartfeed/backend-api prisma:deploy', {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env,
    });
    console.log(`  ${colors.green}✔ Migrations applied successfully.${colors.reset}`);

    // 2. Prisma Seed
    console.log(`  ${colors.bright}• Seeding baseline tariff plans & test admin...${colors.reset}`);
    execSync('pnpm --filter @smartfeed/backend-api prisma:seed', {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env,
    });
    console.log(`  ${colors.green}✔ Baseline data seeded successfully.${colors.reset}`);

    console.log(`\n${colors.green}${colors.bright}✅ [E2E DB Sync] PostgreSQL E2E database on port 5433 is 100% in parity with dev/prod schema!${colors.reset}\n`);
  } catch (err) {
    console.error(`\n${colors.red}✖ [E2E DB Sync] Failed to synchronize E2E database: ${err.message}${colors.reset}\n`);
    process.exit(1);
  }
}

main();
