import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Role, PlanType, TargetApp, NavigationItemDto } from '@smartfeed/shared';
import { GetAccessibleNavigationQuery } from '@/modules/navigation/queries/get-accessible-navigation.query';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';

const PLAN_HIERARCHY: Record<PlanType, number> = {
  [PlanType.STARTER]: 1,
  [PlanType.GROWTH]: 2,
  [PlanType.PRO]: 3,
  [PlanType.ENTERPRISE]: 4,
};

@QueryHandler(GetAccessibleNavigationQuery)
export class GetAccessibleNavigationHandler implements IQueryHandler<GetAccessibleNavigationQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(query: GetAccessibleNavigationQuery) {
    const { userRole, userPlan, targetApp } = query;
    const cacheKey = `navigation:acc:${userRole}:${userPlan ?? 'none'}:${targetApp}`;

    const cached = await this.cache.get<NavigationItemDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // 1. Fetch active visible navigation items for the target app
    const items = await this.prisma.navigationItem.findMany({
      where: {
        isVisible: true,
        OR: [{ targetApp }, { targetApp: TargetApp.ALL }],
      },
      orderBy: { order: 'asc' },
    });

    // 2. Filter by role and license plan permissions
    const userPlanLevel = userPlan ? (PLAN_HIERARCHY[userPlan] ?? 1) : 1;
    const isElevatedAdmin = userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN;

    const result = items.filter((item) => {
      // Role-based check
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        if (!item.requiredRoles.includes(userRole)) {
          return false;
        }
      }

      // Elevated admins have access to all items
      if (isElevatedAdmin) {
        return true;
      }

      // Plan-based check
      if (item.requiredPlan) {
        const requiredLevel = PLAN_HIERARCHY[item.requiredPlan] ?? 1;
        if (userPlanLevel < requiredLevel) {
          return false;
        }
      }

      return true;
    });

    await this.cache.set(cacheKey, result, 3600);
    return result;
  }
}
