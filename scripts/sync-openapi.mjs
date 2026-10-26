#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
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

const candidateUrls = [
  process.env.OPENAPI_URL,
  process.env.E2E_SERVER_API_URL ? `${process.env.E2E_SERVER_API_URL}/docs-json` : null,
  'http://localhost:4001/api/docs-json',
  'http://localhost:4000/api/docs-json',
].filter(Boolean);

async function fetchOpenApiDoc() {
  for (const url of candidateUrls) {
    try {
      console.log(`  ${colors.bright}• Probing Swagger endpoint: ${url}...${colors.reset}`);
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const text = await res.text();
        const json = JSON.parse(text);
        if (json.openapi || json.swagger) {
          console.log(`  ${colors.green}✔ Successfully connected to: ${url}${colors.reset}`);
          return { url, json };
        }
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

async function main() {
  console.log(`\n${colors.cyan}${colors.bright}🔄 [OpenAPI Sync] Fetching OpenAPI 3.0 specification from NestJS Backend...${colors.reset}`);

  const result = await fetchOpenApiDoc();
  if (!result) {
    console.error(`\n${colors.red}✖ [OpenAPI Sync] Could not reach Swagger documentation at any of the candidate URLs:${colors.reset}`);
    for (const url of candidateUrls) {
      console.error(`   - ${url}`);
    }
    console.error(`\n${colors.yellow}Please ensure backend is running via 'pnpm dev:backend' or 'pnpm dev:backend:e2e'.${colors.reset}\n`);
    process.exit(1);
  }

  const { url, json } = result;

  // 1. Save openapi.json
  const schemaDir = path.resolve(workspaceRoot, 'e2e/schema');
  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true });
  }

  const openApiPath = path.join(schemaDir, 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(json, null, 2), 'utf-8');
  console.log(`  ${colors.green}✔ Saved raw OpenAPI spec to: e2e/schema/openapi.json${colors.reset}`);

  // 2. Generate TypeScript types with openapi-typescript
  console.log(`  ${colors.bright}• Generating TypeScript contracts (openapi-typescript)...${colors.reset}`);
  const contractsDir = path.resolve(workspaceRoot, 'e2e/core/contracts');
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const generatedContractsPath = path.join(contractsDir, 'api.generated.ts');

  execSync(`pnpm --filter @smartfeed/e2e exec openapi-typescript ./schema/openapi.json -o ./core/contracts/api.generated.ts`, {
    cwd: path.resolve(workspaceRoot, 'e2e'),
    stdio: 'inherit',
  });

  console.log(`  ${colors.green}✔ TypeScript contracts generated at: e2e/core/contracts/api.generated.ts${colors.reset}`);

  const pathsCount = Object.keys(json.paths || {}).length;
  console.log(`\n${colors.green}${colors.bright}✅ [OpenAPI Sync] Synchronized ${pathsCount} API paths from ${url}!${colors.reset}\n`);
}

main().catch((err) => {
  console.error(`\n${colors.red}✖ [OpenAPI Sync] Error: ${err.message}${colors.reset}\n`);
  process.exit(1);
});
