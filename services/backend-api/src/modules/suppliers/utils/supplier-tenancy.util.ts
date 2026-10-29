import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';

/**
 * Builds organization & user multi-tenancy filter for suppliers (SEC-04, DEF-07).
 * Ensures invited organization members can access company suppliers.
 */
export async function getSupplierTenancyWhere(
  prisma: PrismaService,
  userId: string,
): Promise<Prisma.SupplierWhereInput> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  const orgIds = memberships.map((m) => m.organizationId);

  return {
    OR: [{ userId }, ...(orgIds.length > 0 ? [{ organizationId: { in: orgIds } }] : [])],
  };
}

/**
 * Resolves the primary organization ID for a user.
 */
export async function resolveUserOrganizationId(
  prisma: PrismaService,
  userId: string,
): Promise<string | undefined> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true },
    orderBy: { joinedAt: 'asc' },
  });
  return membership?.organizationId;
}
