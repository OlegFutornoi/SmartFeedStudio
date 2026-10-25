import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 30000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],
  outputDir: 'reports/artifacts',
  use: {
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'uk-UA',
  },
  projects: [
    // ----------------------------------------------------
    // 1. SERVER BACKEND (API Integration)
    // ----------------------------------------------------
    {
      name: 'server-backend:setup',
      testMatch: /server\/backend\/setup\/server-backend\.setup\.ts/,
      teardown: 'server-backend:teardown',
    },
    {
      name: 'server-backend:teardown',
      testMatch: /server\/backend\/setup\/server-backend\.teardown\.ts/,
    },
    {
      name: 'server-backend',
      testMatch: /server\/backend\/specs\/.*\.spec\.ts/,
      dependencies: ['server-backend:setup'],
      use: {
        baseURL: env.E2E_SERVER_API_URL,
      },
    },

    // ----------------------------------------------------
    // 2. SERVER ADMIN (Web UI)
    // ----------------------------------------------------
    {
      name: 'server-admin:setup',
      testMatch: /server\/admin\/setup\/server-admin\.setup\.ts/,
    },
    {
      name: 'server-admin',
      testMatch: /server\/admin\/specs\/.*\.spec\.ts/,
      dependencies: ['server-admin:setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.E2E_ADMIN_URL,
        storageState: path.resolve(__dirname, '.auth/server-admin.json'),
      },
    },

    // ----------------------------------------------------
    // 3. LOCAL BACKEND (SQLite Docker API)
    // ----------------------------------------------------
    {
      name: 'local-backend:setup',
      testMatch: /local\/backend\/setup\/local-backend\.setup\.ts/,
    },
    {
      name: 'local-backend',
      testMatch: /local\/backend\/specs\/.*\.spec\.ts/,
      dependencies: ['local-backend:setup'],
      use: {
        baseURL: env.E2E_LOCAL_DB_URL,
      },
    },

    // ----------------------------------------------------
    // 4. LOCAL DESKTOP (Client UI)
    // ----------------------------------------------------
    {
      name: 'local-desktop:setup',
      testMatch: /local\/desktop\/setup\/local-desktop\.setup\.ts/,
    },
    {
      name: 'local-desktop',
      testMatch: /local\/desktop\/specs\/.*\.spec\.ts/,
      dependencies: ['local-desktop:setup', 'local-backend:setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.E2E_DESKTOP_URL,
        storageState: path.resolve(__dirname, '.auth/local-desktop.json'),
      },
    },
  ],
});
