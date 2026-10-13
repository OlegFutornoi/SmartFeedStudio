import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@/prisma/prisma.module';
import { PageGuidesController } from '@/modules/page-guides/page-guides.controller';
import { GetPageGuidesHandler } from '@/modules/page-guides/queries/get-page-guides.handler';
import { GetAiAssistantProfileHandler } from '@/modules/page-guides/queries/get-ai-assistant-profile.handler';
import { UpdateAiAssistantProfileHandler } from '@/modules/page-guides/commands/update-ai-assistant-profile.handler';

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [PageGuidesController],
  providers: [GetPageGuidesHandler, GetAiAssistantProfileHandler, UpdateAiAssistantProfileHandler],
  exports: [GetPageGuidesHandler, GetAiAssistantProfileHandler, UpdateAiAssistantProfileHandler],
})
export class PageGuidesModule {}
