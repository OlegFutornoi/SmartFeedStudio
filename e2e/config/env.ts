import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env then .env.local if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

const EnvSchema = z.object({
  E2E_SERVER_API_URL: z.string().url().default('http://localhost:4000/api'),
  E2E_ADMIN_URL: z.string().url().default('http://localhost:3000'),
  E2E_LOCAL_DB_URL: z.string().url().default('http://localhost:5002'),
  E2E_LOCAL_DB_REFERENCE_URL: z.string().url().default('http://localhost:5001'),
  E2E_DESKTOP_URL: z.string().url().default('http://127.0.0.1:1421'),
  E2E_TEST_DATABASE_URL: z
    .string()
    .default(
      'postgresql://postgres:postgrespassword@localhost:5432/smartfeed_test_db?schema=public',
    ),
  E2E_ADMIN_EMAIL: z.string().email().default('admin@smartfeed.local'),
  E2E_ADMIN_PASSWORD: z.string().default('adminpassword'),
  E2E_USER_EMAIL: z.string().email().default('user@smartfeed.local'),
  E2E_USER_PASSWORD: z.string().default('userpassword'),
  E2E_LOCALE: z.enum(['uk', 'en']).default('uk'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ [E2E Config] Invalid environment configuration:');
  parsed.error.issues.forEach((issue) => {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  });
  throw new Error('E2E environment configuration invalid.');
}

export const env = parsed.data;
