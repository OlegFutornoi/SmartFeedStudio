import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LicenseEntity, PlanType } from '@smartfeed/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateLicenseStatusCommand } from '@/modules/licenses/commands/update-license-status.command';

@Injectable()
@CommandHandler(UpdateLicenseStatusCommand)
export class UpdateLicenseStatusHandler implements ICommandHandler<
  UpdateLicenseStatusCommand,
  LicenseEntity
> {
  private readonly logger = new Logger(UpdateLicenseStatusHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateLicenseStatusCommand): Promise<LicenseEntity> {
    const { licenseId, isActive } = command;

    const existing = await this.prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!existing) {
      throw new NotFoundException(`License with ID ${licenseId} not found`);
    }

    const updated = await this.prisma.license.update({
      where: { id: licenseId },
      data: { isActive },
    });

    this.logger.log(
      `Updated license ${updated.licenseKey} (ID: ${licenseId}) status to isActive=${isActive}`,
    );

    const isExpired = Boolean(updated.expiresAt && new Date(updated.expiresAt) < new Date());
    const daysRemaining = updated.expiresAt
      ? Math.max(
          0,
          Math.ceil((new Date(updated.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        )
      : null;

    return {
      id: updated.id,
      userId: updated.userId,
      licenseKey: updated.licenseKey,
      planType: updated.planType as PlanType,
      canCloudBackup: updated.canCloudBackup,
      maxXmlLimit: updated.maxXmlLimit,
      aiCredits: updated.aiCredits,
      maxFeedsLimit: updated.maxFeedsLimit,
      maxChannelsLimit: updated.maxChannelsLimit,
      maxTeamSeats: updated.maxTeamSeats,
      maxSuppliersLimit: updated.maxSuppliersLimit,
      hasApiAccess: updated.hasApiAccess,
      hasFeedDiff: updated.hasFeedDiff,
      hasWhiteLabel: updated.hasWhiteLabel,
      hasSso: updated.hasSso,
      hasAuditLog: updated.hasAuditLog,
      isActive: updated.isActive,
      expiresAt: updated.expiresAt,
      isExpired,
      daysRemaining,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
