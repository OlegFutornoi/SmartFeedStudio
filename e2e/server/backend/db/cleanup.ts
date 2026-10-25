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

      const protectedEmails = ['qatest@gmail.com', 'shoplinkerxml@gmail.com'];
      const emailFilter = runId
        ? `email LIKE '%e2e.%' AND email LIKE '%${runId}%'`
        : `email LIKE 'e2e.%' OR email LIKE '%@smartfeed.local'`;

      // 1. Snapshot and ProductImage
      await client.query(`
        DELETE FROM "ProductImage" WHERE "id" IN (
          SELECT pi."id" FROM "ProductImage" pi
          JOIN "Product" p ON p."id" = pi."productId"
          JOIN "Supplier" s ON s."id" = p."supplierId"
          JOIN "User" u ON u."id" = s."userId"
          WHERE (${emailFilter}) AND u."email" NOT IN (${protectedEmails.map((e) => `'${e}'`).join(',')})
        );
      `);

      // 2. Organization Invitations & Members
      await client.query(`
        DELETE FROM "OrganizationInvitation" WHERE "email" LIKE '%e2e.%' OR "email" LIKE '%@smartfeed.local';
      `);

      // 3. Licenses
      await client.query(`
        DELETE FROM "License" WHERE "userId" IN (
          SELECT "id" FROM "User" WHERE (${emailFilter}) AND "email" NOT IN (${protectedEmails.map((e) => `'${e}'`).join(',')})
        );
      `);

      // 4. Test Users (strictly scoped by test prefixes)
      await client.query(`
        DELETE FROM "User" WHERE (${emailFilter}) AND "email" NOT IN (${protectedEmails.map((e) => `'${e}'`).join(',')});
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
