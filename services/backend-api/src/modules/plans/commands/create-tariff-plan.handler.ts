import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTariffPlanCommand } from './create-tariff-plan.command';

@Injectable()
@CommandHandler(CreateTariffPlanCommand)
export class CreateTariffPlanHandler implements ICommandHandler<
  CreateTariffPlanCommand,
  TariffPlanDto
> {
  private readonly logger = new Logger(CreateTariffPlanHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTariffPlanCommand): Promise<TariffPlanDto> {
    const { dto } = command;
    const normalizedCode = dto.code.toUpperCase().trim();

    const existing = await this.prisma.tariffPlan.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictException(`Tariff plan with code "${normalizedCode}" already exists`);
    }

    const plan = await this.prisma.tariffPlan.create({
      data: {
        code: normalizedCode,
        nameUk: dto.nameUk.trim(),
        nameEn: dto.nameEn.trim(),
        descriptionUk: dto.descriptionUk?.trim() || null,
        descriptionEn: dto.descriptionEn?.trim() || null,
        priceMonthly: dto.priceMonthly,
        priceYearly: dto.priceYearly ?? null,
        currency: dto.currency || 'USD',
        maxXmlLimit: dto.maxXmlLimit,
        aiCredits: dto.aiCredits,
        canCloudBackup: dto.canCloudBackup ?? false,
        isPopular: dto.isPopular ?? false,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
        featuresUk: dto.featuresUk || [],
        featuresEn: dto.featuresEn || [],
      },
    });

    this.logger.log(`Created tariff plan: code=${plan.code}, nameUk="${plan.nameUk}"`);

    return {
      id: plan.id,
      code: plan.code,
      nameUk: plan.nameUk,
      nameEn: plan.nameEn,
      descriptionUk: plan.descriptionUk,
      descriptionEn: plan.descriptionEn,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
      currency: plan.currency,
      maxXmlLimit: plan.maxXmlLimit,
      aiCredits: plan.aiCredits,
      canCloudBackup: plan.canCloudBackup,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      order: plan.order,
      featuresUk: plan.featuresUk,
      featuresEn: plan.featuresEn,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
