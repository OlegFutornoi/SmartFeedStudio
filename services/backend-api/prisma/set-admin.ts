import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5432/smartfeed_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin@gmail.com';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  console.log(`🔐 Setting up admin: ${email}...`);

  // Upsert the user with email admin@gmail.com
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
    },
    create: {
      email,
      passwordHash,
      fullName: 'Administrator',
      role: 'SUPER_ADMIN',
    },
  });

  // Ensure license exists
  await prisma.license.upsert({
    where: { licenseKey: 'SF-ENTERPRISE-GMAIL-ADMIN' },
    update: {
      userId: user.id,
      isActive: true,
    },
    create: {
      userId: user.id,
      licenseKey: 'SF-ENTERPRISE-GMAIL-ADMIN',
      planType: 'ENTERPRISE',
      canCloudBackup: true,
      maxXmlLimit: 1000000,
      aiCredits: 5000,
      isActive: true,
    },
  });

  console.log('✅ Admin credentials successfully configured:');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
}

setAdmin()
  .catch((err) => {
    console.error('❌ Failed to set admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
