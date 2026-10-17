import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FeedsController } from '@/modules/feeds/feeds.controller';
import { FetchFeedUrlHandler } from '@/modules/feeds/queries/handlers/fetch-feed-url.handler';
import { CheckFeedCollisionHandler } from '@/modules/feeds/queries/handlers/check-feed-collision.handler';

@Module({
  imports: [CqrsModule],
  controllers: [FeedsController],
  providers: [FetchFeedUrlHandler, CheckFeedCollisionHandler],
  exports: [FetchFeedUrlHandler, CheckFeedCollisionHandler],
})
export class FeedsModule {}
