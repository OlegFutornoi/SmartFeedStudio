import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateAiAssistantProfileCommand } from '@/modules/page-guides/commands/update-ai-assistant-profile.command';
import { AiAssistantProfileDto, DEFAULT_AI_ASSISTANT_PROFILE } from '@smartfeed/shared';

@Injectable()
@CommandHandler(UpdateAiAssistantProfileCommand)
export class UpdateAiAssistantProfileHandler implements ICommandHandler<
  UpdateAiAssistantProfileCommand,
  AiAssistantProfileDto
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateAiAssistantProfileCommand): Promise<AiAssistantProfileDto> {
    const { dto } = command;
    const updatedSetting = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.aiAssistantSetting.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        return tx.aiAssistantSetting.update({
          where: { id: existing.id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
            ...(dto.roleUk !== undefined ? { roleUk: dto.roleUk } : {}),
            ...(dto.roleEn !== undefined ? { roleEn: dto.roleEn } : {}),
            ...(dto.badgeUk !== undefined ? { badgeUk: dto.badgeUk } : {}),
            ...(dto.badgeEn !== undefined ? { badgeEn: dto.badgeEn } : {}),
          },
        });
      }

      return tx.aiAssistantSetting.create({
        data: {
          name: dto.name || DEFAULT_AI_ASSISTANT_PROFILE.name,
          avatarUrl: dto.avatarUrl,
          roleUk: dto.roleUk || DEFAULT_AI_ASSISTANT_PROFILE.roleUk,
          roleEn: dto.roleEn || DEFAULT_AI_ASSISTANT_PROFILE.roleEn,
          badgeUk: dto.badgeUk || DEFAULT_AI_ASSISTANT_PROFILE.badgeUk,
          badgeEn: dto.badgeEn || DEFAULT_AI_ASSISTANT_PROFILE.badgeEn,
        },
      });
    });

    return {
      name: updatedSetting.name,
      avatarUrl: updatedSetting.avatarUrl || undefined,
      roleUk: updatedSetting.roleUk,
      roleEn: updatedSetting.roleEn,
      badgeUk: updatedSetting.badgeUk,
      badgeEn: updatedSetting.badgeEn,
    };
  }
}
