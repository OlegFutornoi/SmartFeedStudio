import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { seedTariffPlans, tariffPlansSeedData } from '@/prisma/seeds/tariffPlans.seed';
import { seedUsersAndOrgs } from '@/prisma/seeds/users.seed';
import { seedNavigation, navigationItemsSeedData } from '@/prisma/seeds/navigation.seed';
import { seedPaymentSettings } from '@/prisma/seeds/paymentSettings.seed';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding for SmartFeed Studio...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Platform Owner';

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be defined in .env');
  }

  // 1. Seed Dynamic Tariff Plans
  await seedTariffPlans(prisma);

  // 2. Seed Super Admin User & Organization Teardown
  await seedUsersAndOrgs(prisma, adminEmail, adminPassword, adminName);

  // 3. Seed Dynamic Navigation Items
  await seedNavigation(prisma);

  // 4. Seed Payment Gateway Settings
  await seedPaymentSettings(prisma);

  console.log('✅ Seeding completed:');
  console.log(
    `   - Seeded ${tariffPlansSeedData.length} tariff plans: STARTER, GROWTH, PRO, ENTERPRISE`,
  );
  console.log(`   - Super Admin: ${adminEmail} (Role: SUPER_ADMIN)`);
  console.log(`   - Seeded ${navigationItemsSeedData.length} dynamic navigation items`);
  console.log(`   - Seeded default WayForPay Sandbox payment gateway settings`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
