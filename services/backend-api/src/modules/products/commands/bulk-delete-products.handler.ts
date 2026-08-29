import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { BulkDeleteResultDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { BulkDeleteProductsCommand } from './bulk-delete-products.command';

@Injectable()
@CommandHandler(BulkDeleteProductsCommand)
export class BulkDeleteProductsHandler implements ICommandHandler<
  BulkDeleteProductsCommand,
  BulkDeleteResultDto
> {
  private readonly logger = new Logger(BulkDeleteProductsHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: BulkDeleteProductsCommand): Promise<BulkDeleteResultDto> {
    const { userId, dto } = command;
    const { productIds, categoryIds, supplierIds } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMemberships: { take: 1, orderBy: { joinedAt: 'desc' } },
      },
    });
    const organizationId = user?.organizationMemberships?.[0]?.organizationId || null;
    const userScope = organizationId ? { OR: [{ organizationId }, { userId }] } : { userId };

    const orConditions: any[] = [];

    if (productIds && productIds.length > 0) {
      orConditions.push({ id: { in: productIds } });
    }
    if (categoryIds && categoryIds.length > 0) {
      orConditions.push({ categoryId: { in: categoryIds } });
    }
    if (supplierIds && supplierIds.length > 0) {
      orConditions.push({ supplierId: { in: supplierIds } });
    }

    if (orConditions.length === 0) {
      const remainingCount = await this.prisma.product.count({
        where: { catalog: userScope },
      });
      return {
        deletedCount: 0,
        remainingCount,
        message: 'Не вказано елементів для видалення',
      };
    }

    const deleteResult = await this.prisma.product.deleteMany({
      where: {
        catalog: userScope,
        OR: orConditions,
      },
    });

    if (categoryIds && categoryIds.length > 0) {
      await this.prisma.productCategory.deleteMany({
        where: {
          id: { in: categoryIds },
          catalog: userScope,
          products: { none: {} },
        },
      });
    }

    const remainingCount = await this.prisma.product.count({
      where: { catalog: userScope },
    });

    this.logger.log(
      `User ${userId} bulk-deleted ${deleteResult.count} products. Remaining: ${remainingCount}`,
    );

    return {
      deletedCount: deleteResult.count,
      remainingCount,
      message: `Успішно видалено ${deleteResult.count} товарів`,
    };
  }
}
