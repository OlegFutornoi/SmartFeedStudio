import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetPaymentStatsQuery } from '@/modules/payments/queries/get-payment-stats.query';
import { PaymentStatsDto } from '@smartfeed/shared';

@QueryHandler(GetPaymentStatsQuery)
export class GetPaymentStatsHandler implements IQueryHandler<GetPaymentStatsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PaymentStatsDto> {
    const statusGroups = await this.prisma.paymentTransaction.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    let successfulCount = 0;
    let pendingCount = 0;
    let declinedCount = 0;
    let totalRevenueUah = 0;

    for (const group of statusGroups) {
      if (group.status === 'APPROVED') {
        successfulCount = group._count.id;
        totalRevenueUah = Number(group._sum.amount || 0);
      } else if (group.status === 'PENDING') {
        pendingCount = group._count.id;
      } else if (group.status === 'DECLINED') {
        declinedCount = group._count.id;
      }
    }
    const averageCheckUah =
      successfulCount > 0 ? Math.round((totalRevenueUah / successfulCount) * 100) / 100 : 0;

    const totalAttempts = successfulCount + declinedCount;
    const successRatePercent =
      totalAttempts > 0 ? Math.round((successfulCount / totalAttempts) * 1000) / 10 : 100;

    return {
      totalRevenueUah,
      successfulCount,
      pendingCount,
      declinedCount,
      averageCheckUah,
      successRatePercent,
    };
  }
}
