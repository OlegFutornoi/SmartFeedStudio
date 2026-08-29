import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSupplierCommand } from './create-supplier.command';
import { SupplierDto } from '@smartfeed/shared';

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler implements ICommandHandler<CreateSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateSupplierCommand): Promise<SupplierDto> {
    const { userId, dto, organizationId } = command;

    // Check if supplier code already exists for this user/org
    const existing = await this.prisma.supplier.findFirst({
      where: {
        userId,
        code: dto.code,
      },
    });

    if (existing) {
      throw new ConflictException(`Supplier with code "${dto.code}" already exists`);
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        userId,
        organizationId: organizationId || null,
        name: dto.name,
        code: dto.code,
        contactPhone: dto.contactPhone || null,
        contactEmail: dto.contactEmail || null,
        website: dto.website || null,
        notes: dto.notes || null,
        defaultMarginPercent: dto.defaultMarginPercent ?? 0,
        defaultFixedMarkup: dto.defaultFixedMarkup ?? 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
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
      id: supplier.id,
      organizationId: supplier.organizationId,
      userId: supplier.userId,
      name: supplier.name,
      code: supplier.code,
      contactPhone: supplier.contactPhone,
      contactEmail: supplier.contactEmail,
      website: supplier.website,
      notes: supplier.notes,
      defaultMarginPercent: Number(supplier.defaultMarginPercent),
      defaultFixedMarkup: Number(supplier.defaultFixedMarkup),
      isActive: supplier.isActive,
      productsCount: supplier._count.products,
      activeFeedsCount: supplier._count.feedSources,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    };
  }
}
