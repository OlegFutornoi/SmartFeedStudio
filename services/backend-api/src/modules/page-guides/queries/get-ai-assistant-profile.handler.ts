import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GetAiAssistantProfileQuery } from '@/modules/page-guides/queries/get-ai-assistant-profile.query';
import { AiAssistantProfileDto, DEFAULT_AI_ASSISTANT_PROFILE } from '@smartfeed/shared';

@Injectable()
@QueryHandler(GetAiAssistantProfileQuery)
export class GetAiAssistantProfileHandler implements IQueryHandler<
  GetAiAssistantProfileQuery,
  AiAssistantProfileDto
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<AiAssistantProfileDto> {
    const setting = await this.prisma.aiAssistantSetting.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!setting) {
      return DEFAULT_AI_ASSISTANT_PROFILE;
    }

    return {
      name: setting.name,
      avatarUrl: setting.avatarUrl || undefined,
      roleUk: setting.roleUk,
      roleEn: setting.roleEn,
      badgeUk: setting.badgeUk,
      badgeEn: setting.badgeEn,
    };
  }
}
