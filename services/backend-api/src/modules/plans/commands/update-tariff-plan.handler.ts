import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { TariffPlanDto } from '@smartfeed/shared';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateTariffPlanCommand } from './update-tariff-plan.command';
import { mapTariffPlanToDto } from '../utils/map-tariff-plan-to-dto';

@Injectable()
@CommandHandler(UpdateTariffPlanCommand)
export class UpdateTariffPlanHandler implements ICommandHandler<
  UpdateTariffPlanCommand,
  TariffPlanDto
> {
  private readonly logger = new Logger(UpdateTariffPlanHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateTariffPlanCommand): Promise<TariffPlanDto> {
    const { id, dto } = command;

    const existing = await this.prisma.tariffPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Tariff plan with ID "${id}" not found`);
    }

    if (dto.code && dto.code !== existing.code) {
      const codeConflict = await this.prisma.tariffPlan.findUnique({
        where: { code: dto.code.toUpperCase().trim() },
      });
      if (codeConflict) {
        throw new ConflictException(`Tariff plan with code "${dto.code}" already exists`);
      }
    }

    const updated = await this.prisma.tariffPlan.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase().trim() : undefined,
        nameUk: dto.nameUk?.trim(),
        nameEn: dto.nameEn?.trim(),
        descriptionUk:
          dto.descriptionUk !== undefined ? dto.descriptionUk?.trim() || null : undefined,
        descriptionEn:
          dto.descriptionEn !== undefined ? dto.descriptionEn?.trim() || null : undefined,
        priceMonthly: dto.priceMonthly !== undefined ? dto.priceMonthly : undefined,
        priceYearly: dto.priceYearly !== undefined ? dto.priceYearly : undefined,
        currency: dto.currency,
        maxXmlLimit: dto.maxXmlLimit,
        aiCredits: dto.aiCredits,
        canCloudBackup: dto.canCloudBackup,
        maxFeedsLimit: dto.maxFeedsLimit,
        maxChannelsLimit: dto.maxChannelsLimit,
        syncFrequencyHours: dto.syncFrequencyHours,
        maxStorageGb: dto.maxStorageGb,
        maxTeamSeats: dto.maxTeamSeats,
        hasApiAccess: dto.hasApiAccess,
        hasWebhooks: dto.hasWebhooks,
        hasFeedDiff: dto.hasFeedDiff,
        hasWhiteLabel: dto.hasWhiteLabel,
        hasSso: dto.hasSso,
        hasAuditLog: dto.hasAuditLog,
        hasCustomS3: dto.hasCustomS3,
        hasPriorityAi: dto.hasPriorityAi,
        slaUptimePercent: dto.slaUptimePercent,
        isPopular: dto.isPopular,
        isActive: dto.isActive,
        order: dto.order,
        durationDays: dto.durationDays !== undefined ? dto.durationDays : undefined,
        featuresUk: dto.featuresUk,
        featuresEn: dto.featuresEn,
      },
    });

    this.logger.log(`Updated tariff plan id=${id}, code=${updated.code}`);

    return mapTariffPlanToDto(updated);
  }
}
