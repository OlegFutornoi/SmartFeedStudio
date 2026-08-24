import { PrismaClient } from '@prisma/client';
import { Role, PlanType, TargetApp } from '@smartfeed/shared';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for SmartFeed Studio...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', saltRounds);
  const gmailAdminPasswordHash = await bcrypt.hash('admin@gmail.com', saltRounds);
  const userPasswordHash = await bcrypt.hash('UserPassword123!', saltRounds);

  // 1. Create Super Admin (admin@smartfeed.studio)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartfeed.studio' },
    update: {
      passwordHash: adminPasswordHash,
    },
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

  // 2. Create Super Admin (admin@gmail.com / admin@gmail.com)
  const gmailAdmin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      passwordHash: gmailAdminPasswordHash,
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: 'admin@gmail.com',
      passwordHash: gmailAdminPasswordHash,
      fullName: 'Admin User',
      role: Role.SUPER_ADMIN,
    },
  });

  await prisma.license.upsert({
    where: { licenseKey: 'SF-ENTERPRISE-GMAIL-ADMIN' },
    update: {},
    create: {
      userId: gmailAdmin.id,
      licenseKey: 'SF-ENTERPRISE-GMAIL-ADMIN',
      planType: PlanType.ENTERPRISE,
      canCloudBackup: true,
      maxXmlLimit: 1000000,
      aiCredits: 5000,
      isActive: true,
      expiresAt: null,
    },
  });

  // 3. Create Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@smartfeed.studio' },
    update: {
      passwordHash: userPasswordHash,
    },
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

  // 4. Seed Dynamic Navigation Items for Desktop & Admin
  const navigationItems = [
    {
      key: 'dashboard',
      labelUk: 'Дашборд',
      labelEn: 'Dashboard',
      path: '/',
      icon: 'LayoutDashboard',
      order: 1,
      isVisible: true,
      requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
      requiredPlan: null,
      targetApp: TargetApp.DESKTOP,
    },
    {
      key: 'catalogs',
      labelUk: 'Каталоги товарів',
      labelEn: 'Product Catalogs',
      path: '/catalogs',
      icon: 'Layers',
      order: 2,
      isVisible: true,
      requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
      requiredPlan: null,
      targetApp: TargetApp.DESKTOP,
    },
    {
      key: 'ai_enrichment',
      labelUk: 'AI Збагачення',
      labelEn: 'AI Enrichment',
      path: '/ai-enrichment',
      icon: 'Sparkles',
      order: 3,
      isVisible: true,
      requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
      requiredPlan: PlanType.PRO,
      targetApp: TargetApp.DESKTOP,
    },
    {
      key: 'cloud_sync',
      labelUk: 'Хмарна синхронізація',
      labelEn: 'Cloud Sync',
      path: '/cloud-sync',
      icon: 'Cloud',
      order: 4,
      isVisible: true,
      requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
      requiredPlan: PlanType.PRO,
      targetApp: TargetApp.DESKTOP,
    },
    {
      key: 'settings',
      labelUk: 'Налаштування',
      labelEn: 'Settings',
      path: '/settings',
      icon: 'Settings',
      order: 5,
      isVisible: true,
      requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
      requiredPlan: null,
      targetApp: TargetApp.DESKTOP,
    },
  ];

  for (const item of navigationItems) {
    await prisma.navigationItem.upsert({
      where: { key: item.key },
      update: {
        labelUk: item.labelUk,
        labelEn: item.labelEn,
        path: item.path,
        icon: item.icon,
        order: item.order,
        isVisible: item.isVisible,
        requiredRoles: item.requiredRoles,
        requiredPlan: item.requiredPlan,
        targetApp: item.targetApp,
      },
      create: item,
    });
  }

  console.log('✅ Seeding completed:');
  console.log(`   - Super Admin: admin@gmail.com       (Password: admin@gmail.com)`);
  console.log(`   - Super Admin: admin@smartfeed.studio (Password: AdminPassword123!)`);
  console.log(`   - Demo User:   demo@smartfeed.studio  (Password: UserPassword123!)`);
  console.log(`   - Seeded ${navigationItems.length} dynamic navigation items`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
