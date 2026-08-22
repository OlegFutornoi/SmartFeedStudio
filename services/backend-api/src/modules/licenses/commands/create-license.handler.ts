import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { LicenseEntity, PlanType, PLAN_LIMITS_MAP } from '@smartfeed/shared';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLicenseCommand } from './create-license.command';

@Injectable()
@CommandHandler(CreateLicenseCommand)
export class CreateLicenseHandler implements ICommandHandler<CreateLicenseCommand, LicenseEntity> {
  private readonly logger = new Logger(CreateLicenseHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateLicenseCommand): Promise<LicenseEntity> {
    const { userId, planType = PlanType.FREE, expiresAt } = command;
    const limits = PLAN_LIMITS_MAP[planType];

    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const licenseKey = `SF-${planType}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

    const license = await this.prisma.license.create({
      data: {
        userId,
        licenseKey,
        planType,
        canCloudBackup: limits.canCloudBackup,
        maxXmlLimit: limits.maxXmlLimit,
        aiCredits: limits.aiCredits,
        isActive: true,
        expiresAt: expiresAt || null,
      },
    });

    this.logger.log(`Created license ${license.licenseKey} for user ${userId}`);

    return {
      id: license.id,
      userId: license.userId,
      licenseKey: license.licenseKey,
      planType: license.planType as PlanType,
      canCloudBackup: license.canCloudBackup,
      maxXmlLimit: license.maxXmlLimit,
      aiCredits: license.aiCredits,
      isActive: license.isActive,
      expiresAt: license.expiresAt,
      createdAt: license.createdAt,
      updatedAt: license.updatedAt,
    };
  }
}
