import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { FeedsController } from './feeds.controller';
import { FeedParserService } from './services/feed-parser.service';
import { ImportFeedContentHandler } from './commands/import-feed-content.handler';
import { FeedImportProcessor } from './processors/feed-import.processor';

const CommandHandlers = [ImportFeedContentHandler];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'feed-import',
    }),
  ],
  controllers: [FeedsController],
  providers: [FeedParserService, FeedImportProcessor, ...CommandHandlers],
  exports: [FeedParserService, BullModule, ...CommandHandlers],
})
export class FeedsModule {}
