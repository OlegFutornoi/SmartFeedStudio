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

    // Fetch dynamic plan from database if present, otherwise fallback to static map
    const dbPlan = await this.prisma.tariffPlan.findUnique({
      where: { code: planType },
    });

    const fallbackLimits = PLAN_LIMITS_MAP[planType] || PLAN_LIMITS_MAP[PlanType.FREE];

    const canCloudBackup = dbPlan ? dbPlan.canCloudBackup : fallbackLimits.canCloudBackup;
    const maxXmlLimit = dbPlan ? dbPlan.maxXmlLimit : fallbackLimits.maxXmlLimit;
    const aiCredits = dbPlan ? dbPlan.aiCredits : fallbackLimits.aiCredits;
    const tariffPlanId = dbPlan ? dbPlan.id : null;

    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const licenseKey = `SF-${planType}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

    const license = await this.prisma.license.create({
      data: {
        userId,
        licenseKey,
        planType,
        tariffPlanId,
        canCloudBackup,
        maxXmlLimit,
        aiCredits,
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
