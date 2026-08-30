import { PrismaService } from '../../src/prisma/prisma.service';

export interface CleanDatabaseOptions {
  userIds?: string[];
  userEmails?: string[];
  emailPrefixes?: string[];
  organizationIds?: string[];
  organizationNames?: string[];
  planCodes?: string[];
  navigationKeys?: string[];
}

/**
 * Global standardized database teardown function.
 * Deletes test artifacts across all models in strict foreign-key safe order:
 * 1. Payment Transactions & Snapshots
 * 2. Organization Invitations
 * 3. Organization Members
 * 4. Licenses (Users & Organizations)
 * 5. Organizations
 * 6. Users
 * 7. Test Tariff Plans
 * 8. Test Navigation Items
 */
export async function cleanDatabase(
  prisma: PrismaService,
  options: CleanDatabaseOptions = {},
): Promise<void> {
  const {
    userIds = [],
    userEmails = [],
    emailPrefixes = [
      'e2e.test+',
      'admintest-',
      'regularuser-',
      'lictest-',
      'licdynamic-',
      'lic-delete-test',
      'admin.lic.test',
      'user.lic.test',
      'expired.lic.test',
      'duration.test',
      'admin.plans.test',
      'user.plans.test',
      'admin.nav.test',
      'user.nav.test',
      'pwreset-',
      'pw-recovery+',
      'pw-reset+',
      'orgtest-',
      'org.test+',
      'orgowner-',
      'orgmember-',
      'orgcolleague-',
      'invowner-',
      'inv.test+',
      'newcolleague-',
      'existingcolleague-',
      'invmember-',
      'short-pw+',
      'no-pw+',
      'duration.test@',
    ],
    organizationIds = [],
    organizationNames = [],
    planCodes = [],
    navigationKeys = [],
  } = options;

  try {
    // 1. Resolve all target User IDs matching explicit IDs, emails, or email prefixes
    const emailConditions: Array<
      { email: string } | { email: { startsWith: string } } | { email: { contains: string } }
    > = [];
    userEmails.forEach((email) => emailConditions.push({ email }));
    emailPrefixes.forEach((prefix) => {
      if (prefix.includes('@') && !prefix.startsWith('@')) {
        emailConditions.push({ email: { contains: prefix } });
      } else {
        emailConditions.push({ email: { startsWith: prefix } });
      }
    });

    const whereUserClause = {
      OR: [
        ...(userIds.length > 0 ? [{ id: { in: userIds } }] : []),
        ...(emailConditions.length > 0 ? emailConditions : []),
      ],
    };

    const matchedUsers = await prisma.user.findMany({
      where: whereUserClause,
      select: { id: true },
    });

    const allUserIds = Array.from(new Set([...userIds, ...matchedUsers.map((u) => u.id)]));

    // 2. Cascade cleanup: Snapshots & Payment Transactions
    if (allUserIds.length > 0) {
      await prisma.snapshot.deleteMany({
        where: { userId: { in: allUserIds } },
      });
      await prisma.paymentTransaction.deleteMany({
        where: { userId: { in: allUserIds } },
      });
    }

    await prisma.paymentTransaction.deleteMany({
      where: {
        OR: [
          { orderReference: { startsWith: 'SF-INV-TEST-' } },
          { orderReference: { startsWith: 'SF-TEST-' } },
        ],
      },
    });

    // 3. Cleanup Organization Invitations
    await prisma.organizationInvitation.deleteMany({
      where: {
        OR: [
          ...(allUserIds.length > 0 ? [{ invitedById: { in: allUserIds } }] : []),
          ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
          ...(emailConditions.length > 0 ? emailConditions : []),
        ],
      },
    });

    // 4. Cleanup Organization Members
    await prisma.organizationMember.deleteMany({
      where: {
        OR: [
          ...(allUserIds.length > 0 ? [{ userId: { in: allUserIds } }] : []),
          ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
        ],
      },
    });

    // 5. Cleanup Licenses (linked to users, organizations, or matching test keys)
    await prisma.license.deleteMany({
      where: {
        OR: [
          ...(allUserIds.length > 0 ? [{ userId: { in: allUserIds } }] : []),
          ...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
          { licenseKey: { startsWith: 'SF-TEST-' } },
          { licenseKey: { startsWith: 'SF-FREE-TEST' } },
        ],
      },
    });

    // 6. Cleanup Organizations
    await prisma.organization.deleteMany({
      where: {
        OR: [
          ...(allUserIds.length > 0 ? [{ ownerId: { in: allUserIds } }] : []),
          ...(organizationIds.length > 0 ? [{ id: { in: organizationIds } }] : []),
          ...(organizationNames.length > 0 ? [{ name: { in: organizationNames } }] : []),
          { name: { startsWith: 'orgtest-' } },
          { name: { startsWith: 'Acme' } },
          { name: { startsWith: 'Globex' } },
          { name: { startsWith: 'Rozetka' } },
        ],
      },
    });

    // 7. Cleanup Users
    if (allUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: allUserIds } },
      });
    }

    // 8. Cleanup Test Tariff Plans
    const planConditions: Array<{ code: string } | { code: { startsWith: string } }> = [
      { code: { startsWith: 'TEST_' } },
      { code: { startsWith: 'PLAN_' } },
      { code: 'CUSTOM_ULTRA' },
    ];
    if (planCodes.length > 0) {
      planConditions.push({ code: { in: planCodes } } as any);
    }
    await prisma.tariffPlan.deleteMany({
      where: {
        OR: planConditions,
      },
    });

    // 9. Cleanup Test Navigation Items
    const navConditions: Array<{ key: string } | { key: { startsWith: string } }> = [
      { key: { startsWith: 'analytics_' } },
      { key: { startsWith: 'custom_' } },
      { key: { startsWith: 'test_' } },
    ];
    if (navigationKeys.length > 0) {
      navConditions.push({ key: { in: navigationKeys } } as any);
    }
    await prisma.navigationItem.deleteMany({
      where: {
        OR: navConditions,
      },
    });
  } catch (error) {
    // Log teardown warnings without masking test execution
    console.warn('[cleanDatabase] Teardown warning:', error);
  }
}
