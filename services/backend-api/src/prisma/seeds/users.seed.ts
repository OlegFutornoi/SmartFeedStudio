import { PrismaClient, Role } from '@/generated/prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsersAndOrgs(
  prisma: PrismaClient,
  adminEmail: string,
  adminPassword: string,
  adminName: string,
): Promise<void> {
  const saltRounds = 10;
  const ownerPasswordHash = await bcrypt.hash(adminPassword, saltRounds);

  // 1. Create Single Super Admin (Owner — No customer licenses needed)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: ownerPasswordHash,
      role: Role.SUPER_ADMIN,
      fullName: adminName,
    },
    create: {
      email: adminEmail,
      passwordHash: ownerPasswordHash,
      fullName: adminName,
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Remove any legacy mock admins or dummy licenses
  await prisma.license.deleteMany({
    where: {
      user: { email: { in: ['admin@gmail.com', 'admin@smartfeed.studio'] } },
    },
  });
  await prisma.organizationMember.deleteMany({
    where: {
      user: { email: { in: ['admin@gmail.com', 'admin@smartfeed.studio'] } },
    },
  });
  await prisma.organization.deleteMany({
    where: {
      id: {
        in: [
          '00000000-0000-0000-0000-000000000000',
          '00000000-0000-0000-0000-000000000001',
          '00000000-0000-0000-0000-000000000002',
        ],
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@gmail.com', 'admin@smartfeed.studio'] },
    },
  });

  // Super Admin is platform host, delete any customer licenses for all SUPER_ADMIN accounts
  await prisma.license.deleteMany({
    where: { user: { role: Role.SUPER_ADMIN } },
  });
}
