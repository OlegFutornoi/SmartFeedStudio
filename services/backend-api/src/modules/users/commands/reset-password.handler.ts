import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ResetPasswordCommand } from '@/modules/users/commands/reset-password.command';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
import * as bcrypt from 'bcrypt';

const TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(command.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: command.userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate cached user and revoke all existing tokens issued prior to this reset
    await this.cache.del(`auth:user:${command.userId}`);
    const revocationTimestamp = Math.floor(Date.now() / 1000);
    await this.cache.set(
      `auth:revoked_before:${command.userId}`,
      revocationTimestamp,
      TOKEN_EXPIRY_SECONDS,
    );

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
