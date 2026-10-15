import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';
import { GetBootstrapQuery } from '@/modules/users/queries/get-bootstrap.query';
import { GetUserByIdQuery } from '@/modules/users/queries/get-user-by-id.query';
import { GetLicenseByUserIdQuery } from '@/modules/licenses/queries/get-license-by-user-id.query';
import { GetUsageQuotasQuery } from '@/modules/licenses/queries/get-usage-quotas.query';
import { GetAccessibleNavigationQuery } from '@/modules/navigation/queries/get-accessible-navigation.query';
import { BootstrapResponseDto, PlanType, Role } from '@smartfeed/shared';

@QueryHandler(GetBootstrapQuery)
export class GetBootstrapHandler implements IQueryHandler<GetBootstrapQuery, BootstrapResponseDto> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: GetBootstrapQuery): Promise<BootstrapResponseDto> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(query.userId));

    const [license, quotas] = await Promise.all([
      this.queryBus.execute(new GetLicenseByUserIdQuery(query.userId)).catch(() => null),
      this.queryBus.execute(new GetUsageQuotasQuery(query.userId)).catch(() => null),
    ]);

    const userPlan = (license?.planType as PlanType) || PlanType.STARTER;
    const userRole = user?.role || Role.USER;

    const navigation = await this.queryBus
      .execute(new GetAccessibleNavigationQuery(userRole, userPlan, query.targetApp))
      .catch(() => []);

    return {
      user,
      license: license || null,
      quotas: quotas || null,
      activeJobsCount: 0,
      navigation: navigation || [],
    };
  }
}
