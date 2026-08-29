import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateSupplierCommand } from './update-supplier.command';
import { SupplierDto } from '@smartfeed/shared';

@CommandHandler(UpdateSupplierCommand)
export class UpdateSupplierHandler implements ICommandHandler<UpdateSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierCommand): Promise<SupplierDto> {
    const { id, userId, dto } = command;

    const supplier = await this.prisma.supplier.findFirst({
      where: { id, userId },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found`);
    }

    if (dto.code && dto.code !== supplier.code) {
      const codeConflict = await this.prisma.supplier.findFirst({
        where: {
          userId,
          code: dto.code,
          id: { not: id },
        },
      });
      if (codeConflict) {
        throw new ConflictException(`Supplier with code "${dto.code}" already exists`);
      }
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.defaultMarginPercent !== undefined && {
          defaultMarginPercent: dto.defaultMarginPercent,
        }),
        ...(dto.defaultFixedMarkup !== undefined && { defaultFixedMarkup: dto.defaultFixedMarkup }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        _count: {
          select: {
            products: true,
            feedSources: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      userId: updated.userId,
      name: updated.name,
      code: updated.code,
      contactPhone: updated.contactPhone,
      contactEmail: updated.contactEmail,
      website: updated.website,
      notes: updated.notes,
      defaultMarginPercent: Number(updated.defaultMarginPercent),
      defaultFixedMarkup: Number(updated.defaultFixedMarkup),
      isActive: updated.isActive,
      productsCount: updated._count.products,
      activeFeedsCount: updated._count.feedSources,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
