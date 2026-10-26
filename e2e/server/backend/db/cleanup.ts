import pg from 'pg';
import { env } from '@/config/env';

const { Pool } = pg;

export async function cleanupServerDatabase(runId?: string): Promise<void> {
  const dbUrl = env.E2E_TEST_DATABASE_URL;

  // Safety invariant: NEVER run against production or non-test databases
  if (!dbUrl.includes('_test')) {
    throw new Error(`[Cleanup Safety] Refusing to run cleanup on non-test database: ${dbUrl}`);
  }

  const pool = new Pool({ connectionString: dbUrl });

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const protectedEmails = [env.E2E_SUPERADMIN_EMAIL, env.E2E_ADMIN_EMAIL].filter(Boolean);
      const emailFilter = runId
        ? `email LIKE '%e2e.%' AND email LIKE '%${runId}%'`
        : `email LIKE 'e2e.%' OR email LIKE '%@smartfeed.local'`;

      // 1. Organization Invitations
      await client.query(`
        DELETE FROM "organization_invitations" WHERE "email" LIKE '%e2e.%' OR "email" LIKE '%@smartfeed.local';
      `);

      // 2. Test Users (cascade deletes organizations, members, licenses, snapshots, suppliers)
      await client.query(`
        DELETE FROM "users" WHERE (${emailFilter}) AND "email" NOT IN (${protectedEmails.map((e) => `'${e}'`).join(',')});
      `);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}
