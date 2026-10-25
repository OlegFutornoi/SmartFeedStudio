import { test as teardown } from '@playwright/test';
import { cleanupServerDatabase } from '../db/cleanup.js';

teardown('teardown server backend test entities', async () => {
  await cleanupServerDatabase();
});
