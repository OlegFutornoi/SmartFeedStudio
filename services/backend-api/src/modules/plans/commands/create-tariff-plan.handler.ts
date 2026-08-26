import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTariffPlanCommand } from './create-tariff-plan.command';
import { mapTariffPlanToDto } from '../utils/map-tariff-plan-to-dto';

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
        maxFeedsLimit: dto.maxFeedsLimit ?? 1,
        maxChannelsLimit: dto.maxChannelsLimit ?? 1,
        syncFrequencyHours: dto.syncFrequencyHours ?? 0,
        maxStorageGb: dto.maxStorageGb ?? 0,
        maxTeamSeats: dto.maxTeamSeats ?? 1,
        hasApiAccess: dto.hasApiAccess ?? false,
        hasWebhooks: dto.hasWebhooks ?? false,
        hasFeedDiff: dto.hasFeedDiff ?? false,
        hasWhiteLabel: dto.hasWhiteLabel ?? false,
        hasSso: dto.hasSso ?? false,
        hasAuditLog: dto.hasAuditLog ?? false,
        hasCustomS3: dto.hasCustomS3 ?? false,
        hasPriorityAi: dto.hasPriorityAi ?? false,
        slaUptimePercent: dto.slaUptimePercent ?? null,
        isPopular: dto.isPopular ?? false,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
        durationDays: dto.durationDays !== undefined ? dto.durationDays : 7,
        featuresUk: dto.featuresUk || [],
        featuresEn: dto.featuresEn || [],
      },
    });

    this.logger.log(`Created tariff plan: code=${plan.code}, nameUk="${plan.nameUk}"`);

    return mapTariffPlanToDto(plan);
  }
}
