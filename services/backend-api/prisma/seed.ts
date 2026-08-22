import { PrismaClient, Role, PlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for SmartFeed Studio...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', saltRounds);
  const userPasswordHash = await bcrypt.hash('UserPassword123!', saltRounds);

  // 1. Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartfeed.studio' },
    update: {},
    create: {
      email: 'admin@smartfeed.studio',
      passwordHash: adminPasswordHash,
      fullName: 'Super Administrator',
      role: Role.SUPER_ADMIN,
    },
  });

  // Assign ENTERPRISE license to Admin
  await prisma.license.upsert({
    where: { licenseKey: 'SF-ENTERPRISE-ADMIN-0001' },
    update: {},
    create: {
      userId: admin.id,
      licenseKey: 'SF-ENTERPRISE-ADMIN-0001',
      planType: PlanType.ENTERPRISE,
      canCloudBackup: true,
      maxXmlLimit: 1000000,
      aiCredits: 5000,
      isActive: true,
      expiresAt: null,
    },
  });

  // 2. Create Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@smartfeed.studio' },
    update: {},
    create: {
      email: 'demo@smartfeed.studio',
      passwordHash: userPasswordHash,
      fullName: 'Demo Store Manager',
      role: Role.USER,
    },
  });

  // Assign PRO license to Demo User
  await prisma.license.upsert({
    where: { licenseKey: 'SF-PRO-DEMO-9900-1122' },
    update: {},
    create: {
      userId: demoUser.id,
      licenseKey: 'SF-PRO-DEMO-9900-1122',
      planType: PlanType.PRO,
      canCloudBackup: true,
      maxXmlLimit: 50000,
      aiCredits: 500,
      isActive: true,
    },
  });

  console.log('✅ Seeding completed:');
  console.log(`   - Super Admin: admin@smartfeed.studio (Password: AdminPassword123!)`);
  console.log(`   - Demo User:   demo@smartfeed.studio  (Password: UserPassword123!)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
