import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSupplierCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler implements ICommandHandler<CreateSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateSupplierCommand) {
    const { userId, dto, organizationId } = command;

    const created = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.supplier.findFirst({
        where: { userId, code: dto.code },
      });
      if (existing) {
        throw new ConflictException(`Supplier with code ${dto.code} already exists`);
      }

      return tx.supplier.create({
        data: {
          userId,
          organizationId,
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
          baseCurrency: dto.baseCurrency || 'UAH',
          targetCurrency: dto.targetCurrency || 'UAH',
          exchangeRateMode: dto.exchangeRateMode || 'MANUAL',
          exchangeRate: dto.exchangeRate ?? 1.0,
          currencyBufferPercent: dto.currencyBufferPercent ?? 0,
          priceRounding: dto.priceRounding || 'NONE',
          customRoundingRules: JSON.parse(JSON.stringify(dto.customRoundingRules ?? [])),
          defaultMarginPercent: dto.defaultMarginPercent ?? 0,
          defaultFixedMarkup: dto.defaultFixedMarkup ?? 0,
          isActive: dto.isActive ?? true,
          selectedBankId: dto.selectedBankId ?? null,
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
      baseCurrency: created.baseCurrency,
      targetCurrency: created.targetCurrency,
      exchangeRateMode: created.exchangeRateMode,
      exchangeRate: Number(created.exchangeRate),
      currencyBufferPercent: Number(created.currencyBufferPercent),
      priceRounding: created.priceRounding,
      customRoundingRules: Array.isArray(created.customRoundingRules)
        ? created.customRoundingRules
        : [],
      defaultMarginPercent: Number(created.defaultMarginPercent),
      defaultFixedMarkup: Number(created.defaultFixedMarkup),
      isActive: created.isActive,
      selectedBankId: created.selectedBankId ?? null,
      productsCount: 0,
      activeFeedsCount: 0,
      categoriesCount: 0,
      activeCategoriesCount: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
