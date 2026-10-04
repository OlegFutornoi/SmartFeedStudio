import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FeedsController } from '@/modules/feeds/feeds.controller';
import { FetchFeedUrlHandler } from '@/modules/feeds/queries/handlers/fetch-feed-url.handler';

@Module({
  imports: [CqrsModule],
  controllers: [FeedsController],
  providers: [FetchFeedUrlHandler],
  exports: [FetchFeedUrlHandler],
})
export class FeedsModule {}
