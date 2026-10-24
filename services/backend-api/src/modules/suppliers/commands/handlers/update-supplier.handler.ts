import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateSupplierCommand } from '@/modules/suppliers/commands/suppliers.commands';

@CommandHandler(UpdateSupplierCommand)
export class UpdateSupplierHandler implements ICommandHandler<UpdateSupplierCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateSupplierCommand) {
    const { id, userId, dto } = command;

    const current = await this.prisma.supplier.findFirst({
      where: { id, userId },
    });
    if (!current) {
      throw new NotFoundException(`Supplier ${id} not found`);
    }

    if (dto.code && dto.code !== current.code) {
      const existing = await this.prisma.supplier.findFirst({
        where: { userId, code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Supplier with code ${dto.code} already exists`);
      }
    }

    const data: Prisma.SupplierUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl;
    if (dto.legalName !== undefined) data.legalName = dto.legalName;
    if (dto.taxId !== undefined) data.taxId = dto.taxId;
    if (dto.industry !== undefined) data.industry = dto.industry;
    if (dto.segment !== undefined) data.segment = dto.segment;
    if (dto.managerName !== undefined) data.managerName = dto.managerName;
    if (dto.managerPosition !== undefined) data.managerPosition = dto.managerPosition;
    if (dto.managerPhone !== undefined) data.managerPhone = dto.managerPhone;
    if (dto.managerEmail !== undefined) data.managerEmail = dto.managerEmail;
    if (dto.managerTelegram !== undefined) data.managerTelegram = dto.managerTelegram;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.postcode !== undefined) data.postcode = dto.postcode;
    if (dto.baseCurrency !== undefined) data.baseCurrency = dto.baseCurrency;
    if (dto.targetCurrency !== undefined) data.targetCurrency = dto.targetCurrency;
    if (dto.exchangeRateMode !== undefined) data.exchangeRateMode = dto.exchangeRateMode;
    if (dto.exchangeRate !== undefined) data.exchangeRate = dto.exchangeRate;
    if (dto.currencyBufferPercent !== undefined)
      data.currencyBufferPercent = dto.currencyBufferPercent;
    if (dto.priceRounding !== undefined) data.priceRounding = dto.priceRounding;
    if (dto.customRoundingRules !== undefined) {
      data.customRoundingRules = JSON.parse(JSON.stringify(dto.customRoundingRules));
    }
    if (dto.defaultMarginPercent !== undefined)
      data.defaultMarginPercent = dto.defaultMarginPercent;
    if (dto.defaultFixedMarkup !== undefined) data.defaultFixedMarkup = dto.defaultFixedMarkup;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.supplier.update({
      where: { id },
      data,
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
      logoUrl: updated.logoUrl,
      legalName: updated.legalName,
      taxId: updated.taxId,
      industry: updated.industry,
      segment: updated.segment,
      managerName: updated.managerName,
      managerPosition: updated.managerPosition,
      managerPhone: updated.managerPhone,
      managerEmail: updated.managerEmail,
      managerTelegram: updated.managerTelegram,
      country: updated.country,
      city: updated.city,
      address: updated.address,
      postcode: updated.postcode,
      baseCurrency: updated.baseCurrency,
      targetCurrency: updated.targetCurrency,
      exchangeRateMode: updated.exchangeRateMode,
      exchangeRate: Number(updated.exchangeRate),
      currencyBufferPercent: Number(updated.currencyBufferPercent),
      priceRounding: updated.priceRounding,
      customRoundingRules: Array.isArray(updated.customRoundingRules)
        ? updated.customRoundingRules
        : [],
      defaultMarginPercent: Number(updated.defaultMarginPercent),
      defaultFixedMarkup: Number(updated.defaultFixedMarkup),
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
