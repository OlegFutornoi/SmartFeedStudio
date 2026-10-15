import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChangePasswordCommand } from '@/modules/users/commands/change-password.command';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
import * as bcrypt from 'bcrypt';

const TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(command.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(command.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: command.userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate cached user and revoke all existing tokens issued prior to this change
    await this.cache.del(`auth:user:${command.userId}`);
    const revocationTimestamp = Math.floor(Date.now() / 1000);
    await this.cache.set(
      `auth:revoked_before:${command.userId}`,
      revocationTimestamp,
      TOKEN_EXPIRY_SECONDS,
    );

    return {
      success: true,
      message: 'Password updated successfully',
    };
  }
}
