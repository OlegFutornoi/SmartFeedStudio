import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@smartfeed/shared';
import { PrismaService } from '@/prisma/prisma.service';
import { DeleteUserCommand } from '@/modules/users/commands/delete-user.command';

@Injectable()
@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, { success: boolean }> {
  private readonly logger = new Logger(DeleteUserHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteUserCommand): Promise<{ success: boolean }> {
    const { userId, requesterId } = command;

    if (requesterId && requesterId === userId) {
      throw new BadRequestException('CANNOT_DELETE_OWN_ACCOUNT');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (existing.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('CANNOT_DELETE_SUPER_ADMIN');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    this.logger.log(`Deleted user ${existing.email} (ID: ${userId})`);

    return { success: true };
  }
}
