import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RemoveMemberCommand } from '@/modules/organizations/commands/remove-member.command';

@Injectable()
@CommandHandler(RemoveMemberCommand)
export class RemoveMemberHandler implements ICommandHandler<RemoveMemberCommand> {
  private readonly logger = new Logger(RemoveMemberHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: RemoveMemberCommand) {
    const { organizationId, requesterUserId, memberIdToRemove } = command;

    // 1. Verify requester is OWNER or ADMIN
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
      throw new ForbiddenException('Only organization owners or admins can remove team members');
    }

    // 2. Find target member to remove
    const targetMember = await this.prisma.organizationMember.findUnique({
      where: { id: memberIdToRemove },
    });

    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new NotFoundException(`Member with id "${memberIdToRemove}" not found in organization`);
    }

    // 3. Ensure we do not remove the organization owner
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (organization && organization.ownerId === targetMember.userId) {
      throw new BadRequestException('Cannot remove the owner of the organization');
    }

    // 4. Delete the member
    await this.prisma.organizationMember.delete({
      where: { id: memberIdToRemove },
    });

    this.logger.log(
      `Removed member "${memberIdToRemove}" (user=${targetMember.userId}) from organization "${organizationId}"`,
    );

    return {
      success: true,
      message: 'Member removed successfully',
      removedMemberId: memberIdToRemove,
    };
  }
}
