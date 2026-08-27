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
  const email = process.env.ADMIN_EMAIL || 'admin@admin.com';
  const password = process.env.ADMIN_PASSWORD || 'adminadmin';
  const fullName = process.env.ADMIN_NAME || 'Super Administrator';

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  console.log(`🔐 Setting up Super Admin (${email})...`);

  // Remove any legacy mock admin users if present
  await prisma.license.deleteMany({
    where: {
      user: {
        email: { in: ['admin@gmail.com', 'admin@smartfeed.studio'] },
      },
    },
  });
  await prisma.organizationMember.deleteMany({
    where: {
      user: {
        email: { in: ['admin@gmail.com', 'admin@smartfeed.studio'] },
      },
    },
  });
  await prisma.organization.deleteMany({
    where: {
      id: { in: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'] },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@gmail.com', 'admin@smartfeed.studio'] },
    },
  });

  // Upsert the single Super Admin
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      fullName,
    },
    create: {
      email,
      passwordHash,
      fullName,
      role: 'SUPER_ADMIN',
    },
  });

  // Super Admin is the platform owner — they do not require customer licenses
  await prisma.license.deleteMany({
    where: { userId: user.id },
  });

  console.log('✅ Super Admin successfully configured:');
  console.log(`   Email:    ${email}`);
  console.log(`   Role:     SUPER_ADMIN`);
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
