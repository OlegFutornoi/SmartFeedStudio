import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PlanType, PLAN_LIMITS_MAP } from '@smartfeed/shared';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserCreatedEvent } from '../../users/events/user-created.event';

@Injectable()
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  private readonly logger = new Logger(UserCreatedEventHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: UserCreatedEvent) {
    this.logger.log(`Handling UserCreatedEvent for user: ${event.userId} (${event.email})`);

    const defaultPlan = PlanType.STARTER;
    const limits = PLAN_LIMITS_MAP[defaultPlan];

    // Generate formatted license key: SF-STARTER-XXXX-XXXX-XXXX
    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const formattedKey = `SF-${defaultPlan}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

    try {
      const dbPlan = await this.prisma.tariffPlan.findUnique({
        where: { code: defaultPlan },
      });

      const canCloudBackup = dbPlan ? dbPlan.canCloudBackup : limits.canCloudBackup;
      const maxXmlLimit = dbPlan ? dbPlan.maxXmlLimit : limits.maxXmlLimit;
      const aiCredits = dbPlan ? dbPlan.aiCredits : limits.aiCredits;
      const maxFeedsLimit = dbPlan ? dbPlan.maxFeedsLimit : limits.maxFeedsLimit;
      const maxChannelsLimit = dbPlan ? dbPlan.maxChannelsLimit : limits.maxChannelsLimit;
      const maxTeamSeats = dbPlan ? dbPlan.maxTeamSeats : limits.maxTeamSeats;
      const hasApiAccess = dbPlan ? dbPlan.hasApiAccess : limits.hasApiAccess;
      const hasFeedDiff = dbPlan ? dbPlan.hasFeedDiff : limits.hasFeedDiff;
      const hasWhiteLabel = dbPlan ? dbPlan.hasWhiteLabel : limits.hasWhiteLabel;
      const hasSso = dbPlan ? dbPlan.hasSso : limits.hasSso;
      const hasAuditLog = dbPlan ? dbPlan.hasAuditLog : limits.hasAuditLog;
      const tariffPlanId = dbPlan ? dbPlan.id : null;

      const expiresAt = dbPlan?.durationDays
        ? new Date(Date.now() + dbPlan.durationDays * 24 * 60 * 60 * 1000)
        : null;

      const license = await this.prisma.license.create({
        data: {
          userId: event.userId,
          licenseKey: formattedKey,
          planType: defaultPlan,
          tariffPlanId,
          canCloudBackup,
          maxXmlLimit,
          aiCredits,
          maxFeedsLimit,
          maxChannelsLimit,
          maxTeamSeats,
          hasApiAccess,
          hasFeedDiff,
          hasWhiteLabel,
          hasSso,
          hasAuditLog,
          isActive: true,
          expiresAt,
        },
      });

      this.logger.log(
        `Auto-provisioned STARTER license for user ${event.userId}: key=${license.licenseKey}, expiresAt=${expiresAt?.toISOString() || 'never'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-provision license for user ${event.userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
