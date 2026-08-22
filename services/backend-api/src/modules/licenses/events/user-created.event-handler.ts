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

    const defaultPlan = PlanType.FREE;
    const limits = PLAN_LIMITS_MAP[defaultPlan];

    // Generate formatted license key: SF-FREE-XXXX-XXXX-XXXX
    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    const formattedKey = `SF-${defaultPlan}-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}-${randomBytes.slice(8, 12)}`;

    try {
      const license = await this.prisma.license.create({
        data: {
          userId: event.userId,
          licenseKey: formattedKey,
          planType: defaultPlan,
          canCloudBackup: limits.canCloudBackup,
          maxXmlLimit: limits.maxXmlLimit,
          aiCredits: limits.aiCredits,
          isActive: true,
          expiresAt: null, // Free tier doesn't expire
        },
      });

      this.logger.log(
        `Auto-provisioned FREE license for user ${event.userId}: key=${license.licenseKey}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-provision license for user ${event.userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
