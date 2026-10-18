import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupplierCategoryCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(UpdateSupplierCategoryCommand)
export class UpdateSupplierCategoryHandler implements ICommandHandler<UpdateSupplierCategoryCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierCategoryCommand) {
    const { supplierId, categoryId, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, userId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);

    let cleanFeedCategoryId = dto.feedCategoryId || categoryId;
    if (cleanFeedCategoryId.startsWith('scat_')) {
      const parts = cleanFeedCategoryId.split('_');
      if (parts.length >= 3 && parts[2]) {
        cleanFeedCategoryId = parts[2];
      }
    }

    const existing = await this.prisma.supplierCategoryRule.findFirst({
      where: {
        supplierId,
        OR: [
          { id: categoryId },
          { feedCategoryId: categoryId },
          { feedCategoryId: cleanFeedCategoryId },
        ],
      },
    });

    const data: Prisma.SupplierCategoryRuleUncheckedUpdateInput = {};
    if (dto.name !== undefined && !dto.name.startsWith('scat_')) data.name = dto.name;
    if (dto.productCount !== undefined) data.productCount = dto.productCount;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (
      dto.markupType === 'FIXED' ||
      (dto.fixedMarkup !== undefined &&
        dto.markupType !== 'PERCENT' &&
        dto.marginPercent === undefined)
    ) {
      data.markupType = 'FIXED';
      if (dto.fixedMarkup !== undefined) data.fixedMarkup = dto.fixedMarkup;
      data.marginPercent = null;
    } else if (
      dto.markupType === 'PERCENT' ||
      (dto.marginPercent !== undefined &&
        dto.markupType !== 'FIXED' &&
        dto.fixedMarkup === undefined)
    ) {
      data.markupType = 'PERCENT';
      if (dto.marginPercent !== undefined) data.marginPercent = dto.marginPercent;
      data.fixedMarkup = null;
    } else {
      if (dto.markupType !== undefined) data.markupType = dto.markupType;
      if (dto.marginPercent !== undefined) data.marginPercent = dto.marginPercent;
      if (dto.fixedMarkup !== undefined) data.fixedMarkup = dto.fixedMarkup;
    }

    if (dto.commissionPercent !== undefined) data.commissionPercent = dto.commissionPercent;
    if (dto.marketplaceCode !== undefined) data.marketplaceCode = dto.marketplaceCode;
    if (dto.externalCategoryId !== undefined) data.externalCategoryId = dto.externalCategoryId;
    if (dto.externalCategoryName !== undefined)
      data.externalCategoryName = dto.externalCategoryName;

    const isFixedCreate =
      dto.markupType === 'FIXED' ||
      (dto.fixedMarkup !== undefined &&
        dto.markupType !== 'PERCENT' &&
        dto.marginPercent === undefined);

    const cleanName =
      dto.name && !dto.name.startsWith('scat_')
        ? dto.name
        : dto.externalCategoryName ||
          (cleanFeedCategoryId && !cleanFeedCategoryId.startsWith('scat_')
            ? `Категорія #${cleanFeedCategoryId}`
            : 'Загальна категорія');

    const updated = existing
      ? await this.prisma.supplierCategoryRule.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.supplierCategoryRule.upsert({
          where: {
            supplierId_feedCategoryId: {
              supplierId,
              feedCategoryId: cleanFeedCategoryId,
            },
          },
          create: {
            supplierId,
            feedCategoryId: cleanFeedCategoryId,
            name: cleanName,
            isActive: dto.isActive ?? true,
            markupType: isFixedCreate ? 'FIXED' : 'PERCENT',
            marginPercent: isFixedCreate ? null : (dto.marginPercent ?? null),
            fixedMarkup: isFixedCreate ? (dto.fixedMarkup ?? null) : null,
            commissionPercent: dto.commissionPercent ?? null,
            marketplaceCode: dto.marketplaceCode || 'ROZETKA',
            externalCategoryId: dto.externalCategoryId ?? null,
            externalCategoryName: dto.externalCategoryName ?? null,
            productCount: dto.productCount ?? 0,
          },
          update: data,
        });

    const mappingsRecord: Record<string, unknown> = {};

    if (updated.marketplaceCode && updated.externalCategoryId) {
      mappingsRecord[updated.marketplaceCode] = {
        marketplaceCode: updated.marketplaceCode,
        marketplaceCategoryId: null,
        externalCategoryId: updated.externalCategoryId,
        externalCategoryName: updated.externalCategoryName || '',
        commissionPercent: updated.commissionPercent ? Number(updated.commissionPercent) : 0,
        fixedFee: 0,
      };
    }

    return {
      id: updated.id,
      supplierId: updated.supplierId,
      feedCategoryId: updated.feedCategoryId,
      name: updated.name,
      parentId: updated.parentId,
      isActive: updated.isActive,
      markupType: (updated.markupType as 'PERCENT' | 'FIXED') || 'PERCENT',
      marginPercent: updated.marginPercent !== null ? Number(updated.marginPercent) : null,
      fixedMarkup: updated.fixedMarkup !== null ? Number(updated.fixedMarkup) : null,
      commissionPercent:
        updated.commissionPercent !== null ? Number(updated.commissionPercent) : null,
      marketplaceCategoryId: null,
      marketplaceCode: updated.marketplaceCode,
      externalCategoryId: updated.externalCategoryId,
      externalCategoryName: updated.externalCategoryName,
      marketplaceMappings: mappingsRecord,
      productCount: updated.productCount,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
