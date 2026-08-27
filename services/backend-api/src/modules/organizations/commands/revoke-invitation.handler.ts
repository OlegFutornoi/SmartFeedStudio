import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RevokeInvitationCommand } from './revoke-invitation.command';

@Injectable()
@CommandHandler(RevokeInvitationCommand)
export class RevokeInvitationHandler implements ICommandHandler<RevokeInvitationCommand> {
  private readonly logger = new Logger(RevokeInvitationHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RevokeInvitationCommand) {
    const { organizationId, requesterUserId, invitationId } = command;

    // 1. Verify invitation exists
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundException(`Invitation with id "${invitationId}" not found`);
    }

    // 2. Verify permissions
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
      throw new ForbiddenException('Only organization owners or admins can revoke invitations');
    }

    // 3. Delete or update status to REVOKED
    await this.prisma.organizationInvitation.delete({
      where: { id: invitationId },
    });

    this.logger.log(
      `Invitation "${invitationId}" for "${invitation.email}" in org "${organizationId}" revoked/deleted`,
    );

    return {
      success: true,
      message: 'Invitation has been revoked successfully',
      id: invitationId,
    };
  }
}
