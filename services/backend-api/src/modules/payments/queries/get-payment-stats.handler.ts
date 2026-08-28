import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPaymentStatsQuery } from './get-payment-stats.query';
import { PaymentStatsDto } from '@smartfeed/shared';

@QueryHandler(GetPaymentStatsQuery)
export class GetPaymentStatsHandler implements IQueryHandler<GetPaymentStatsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PaymentStatsDto> {
    const [successfulTxs, pendingCount, declinedCount] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where: { status: 'APPROVED' },
        select: { amount: true },
      }),
      this.prisma.paymentTransaction.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.paymentTransaction.count({
        where: { status: 'DECLINED' },
      }),
    ]);

    const successfulCount = successfulTxs.length;
    const totalRevenueUah = successfulTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
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
