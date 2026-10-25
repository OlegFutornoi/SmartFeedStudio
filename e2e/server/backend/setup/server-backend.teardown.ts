import { test as teardown } from '@playwright/test';
import { cleanupServerDatabase } from '@/server/backend/db/cleanup';

teardown('teardown server backend test entities', async () => {
  await cleanupServerDatabase();
});
