import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateOrganizationCommand } from './update-organization.command';

@Injectable()
@CommandHandler(UpdateOrganizationCommand)
export class UpdateOrganizationHandler implements ICommandHandler<UpdateOrganizationCommand> {
  private readonly logger = new Logger(UpdateOrganizationHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateOrganizationCommand) {
    const { organizationId, requesterUserId, name } = command;

    const requesterMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: requesterUserId,
        },
      },
    });

    if (
      !requesterMember ||
      (requesterMember.role !== 'OWNER' && requesterMember.role !== 'ADMIN')
    ) {
      throw new ForbiddenException(
        'Only organization owners or admins can update organization settings',
      );
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: name.trim() },
    });

    this.logger.log(`Updated organization "${organizationId}" name to "${updated.name}"`);

    return updated;
  }
}
