import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { ResetPasswordCommand } from '@/modules/users/commands/reset-password.command';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
