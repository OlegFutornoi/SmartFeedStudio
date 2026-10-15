import { IQueryHandler, QueryHandler, QueryBus } from '@nestjs/cqrs';
import { GetAdminDashboardOverviewQuery } from '@/modules/users/queries/get-admin-dashboard-overview.query';
import { GetUsersStatsQuery } from '@/modules/users/queries/get-users-stats.query';
import { GetUsersListQuery } from '@/modules/users/queries/get-users-list.query';
import { GetPaymentStatsQuery } from '@/modules/payments/queries/get-payment-stats.query';
import { GetPaymentTransactionsQuery } from '@/modules/payments/queries/get-payment-transactions.query';
import { GetAdminLicensesQuery } from '@/modules/licenses/queries/get-admin-licenses.query';
import { AdminDashboardOverviewDto } from '@smartfeed/shared';

@QueryHandler(GetAdminDashboardOverviewQuery)
export class GetAdminDashboardOverviewHandler implements IQueryHandler<
  GetAdminDashboardOverviewQuery,
  AdminDashboardOverviewDto
> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(): Promise<AdminDashboardOverviewDto> {
    const [stats, users, paymentStats, txData, licenses] = await Promise.all([
      this.queryBus.execute(new GetUsersStatsQuery()),
      this.queryBus.execute(new GetUsersListQuery(undefined, undefined, undefined, 5, 0)),
      this.queryBus.execute(new GetPaymentStatsQuery()).catch(() => null),
      this.queryBus
        .execute(new GetPaymentTransactionsQuery({ limit: 5, offset: 0 }))
        .catch(() => ({ transactions: [], total: 0 })),
      this.queryBus.execute(new GetAdminLicensesQuery(undefined, 5, 0)).catch(() => []),
    ]);

    return {
      stats: stats || {
        totalUsers: 0,
        activeLicenses: 0,
        superAdminsCount: 0,
        standardUsersCount: 0,
      },
      paymentStats: paymentStats || null,
      recentUsers: users || [],
      recentTransactions: txData?.transactions || [],
      recentLicenses: Array.isArray(licenses) ? licenses : [],
    };
  }
}
