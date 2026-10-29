import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSupplierCommand } from '@/modules/suppliers/commands/suppliers.commands';
import { resolveUserOrganizationId } from '@/modules/suppliers/utils/supplier-tenancy.util';

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler implements ICommandHandler<CreateSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateSupplierCommand) {
    const { userId, dto, organizationId } = command;
    const targetOrgId = organizationId || (await resolveUserOrganizationId(this.prisma, userId));

    // Layer-2 quota enforcement: Validate tariff plan maxSuppliersLimit (DEF-06, BE-11)
    const activeLicense = await this.prisma.license.findFirst({
      where: {
        OR: [{ userId }, ...(targetOrgId ? [{ organizationId: targetOrgId }] : [])],
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const maxSuppliers = activeLicense?.maxSuppliersLimit ?? 1;
    const currentSupplierCount = await this.prisma.supplier.count({
      where: {
        OR: [{ userId }, ...(targetOrgId ? [{ organizationId: targetOrgId }] : [])],
      },
    });

    if (currentSupplierCount >= maxSuppliers) {
      throw new ForbiddenException(
        `Supplier limit reached (${currentSupplierCount}/${maxSuppliers}). Please upgrade your tariff plan to add more suppliers.`,
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.supplier.findFirst({
        where: {
          code: dto.code,
          OR: [{ userId }, ...(targetOrgId ? [{ organizationId: targetOrgId }] : [])],
        },
      });
      if (existing) {
        throw new ConflictException(`Supplier with code ${dto.code} already exists`);
      }

      return tx.supplier.create({
        data: {
          userId,
          organizationId: targetOrgId,
          name: dto.name,
          code: dto.code,
          contactPhone: dto.contactPhone,
          contactEmail: dto.contactEmail,
          website: dto.website,
          notes: dto.notes,
          logoUrl: dto.logoUrl,
          legalName: dto.legalName,
          taxId: dto.taxId,
          industry: dto.industry,
          segment: dto.segment,
          managerName: dto.managerName,
          managerPosition: dto.managerPosition,
          managerPhone: dto.managerPhone,
          managerEmail: dto.managerEmail,
          managerTelegram: dto.managerTelegram,
          country: dto.country,
          city: dto.city,
          address: dto.address,
          postcode: dto.postcode,
          defaultMarginPercent: dto.defaultMarginPercent ?? 0,
          defaultFixedMarkup: dto.defaultFixedMarkup ?? 0,
          isActive: dto.isActive ?? true,
        },
      });
    });

    return {
      id: created.id,
      organizationId: created.organizationId,
      userId: created.userId,
      name: created.name,
      code: created.code,
      contactPhone: created.contactPhone,
      contactEmail: created.contactEmail,
      website: created.website,
      notes: created.notes,
      logoUrl: created.logoUrl,
      legalName: created.legalName,
      taxId: created.taxId,
      industry: created.industry,
      segment: created.segment,
      managerName: created.managerName,
      managerPosition: created.managerPosition,
      managerPhone: created.managerPhone,
      managerEmail: created.managerEmail,
      managerTelegram: created.managerTelegram,
      country: created.country,
      city: created.city,
      address: created.address,
      postcode: created.postcode,
      defaultMarginPercent: Number(created.defaultMarginPercent),
      defaultFixedMarkup: Number(created.defaultFixedMarkup),
      isActive: created.isActive,
      productsCount: 0,
      activeFeedsCount: 0,
      categoriesCount: 0,
      activeCategoriesCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
