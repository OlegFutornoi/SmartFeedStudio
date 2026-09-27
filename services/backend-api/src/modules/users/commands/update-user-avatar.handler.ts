import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserAvatarCommand } from './update-user-avatar.command';

@Injectable()
@CommandHandler(UpdateUserAvatarCommand)
export class UpdateUserAvatarHandler implements ICommandHandler<UpdateUserAvatarCommand, void> {
  private readonly logger = new Logger(UpdateUserAvatarHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateUserAvatarCommand): Promise<void> {
    const { userId, avatarUrl } = command;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl,
      },
    });

    this.logger.log(`Avatar updated for user: id=${userId}`);
  }
}
