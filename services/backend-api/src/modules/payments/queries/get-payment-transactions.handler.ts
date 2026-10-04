import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/prisma/prisma.service';
import { GetPaymentTransactionsQuery } from '@/modules/payments/queries/get-payment-transactions.query';
import {
  PaymentTransactionDto,
  PaymentStatus,
  PaymentProvider,
  PaymentInterval,
} from '@smartfeed/shared';
import { Prisma } from '@/generated/prisma/client';

@QueryHandler(GetPaymentTransactionsQuery)
export class GetPaymentTransactionsHandler implements IQueryHandler<GetPaymentTransactionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetPaymentTransactionsQuery,
  ): Promise<{ transactions: PaymentTransactionDto[]; total: number }> {
    const { userId, status, provider, search, limit = 50, offset = 0 } = query.options;

    const where: Prisma.PaymentTransactionWhereInput = {};

    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }
    if (provider) {
      where.provider = provider;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { orderReference: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { fullName: { contains: term, mode: 'insensitive' } } },
        { planCode: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);

    const transactions: PaymentTransactionDto[] = records.map((t) => ({
      id: t.id,
      orderReference: t.orderReference,
      userId: t.userId,
      userEmail: t.user?.email,
      userFullName: t.user?.fullName,
      planCode: t.planCode,
      billingInterval: t.billingInterval as PaymentInterval,
      amount: Number(t.amount),
      currency: t.currency,
      status: t.status as PaymentStatus,
      provider: t.provider as PaymentProvider,
      providerPaymentId: t.providerPaymentId,
      cardPan: t.cardPan,
      cardType: t.cardType,
      issuerBank: t.issuerBank,
      failureReason: t.failureReason,
      paymentMethod: t.paymentMethod,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return { transactions, total };
  }
}
