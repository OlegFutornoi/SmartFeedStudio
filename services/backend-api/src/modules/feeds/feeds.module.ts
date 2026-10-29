import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { FeedsController } from '@/modules/feeds/feeds.controller';
import { FetchFeedUrlHandler } from '@/modules/feeds/queries/handlers/fetch-feed-url.handler';
import { CheckFeedCollisionHandler } from '@/modules/feeds/queries/handlers/check-feed-collision.handler';
import { GetSupplierFeedSourcesHandler } from '@/modules/feeds/queries/handlers/get-supplier-feed-sources.handler';
import { GetAllFeedSourcesHandler } from '@/modules/feeds/queries/handlers/get-all-feed-sources.handler';
import { UpsertSupplierFeedSourceHandler } from '@/modules/feeds/commands/handlers/upsert-supplier-feed-source.handler';
import { UpdateSupplierFeedSourceHandler } from '@/modules/feeds/commands/handlers/update-supplier-feed-source.handler';
import { DeleteSupplierFeedSourceHandler } from '@/modules/feeds/commands/handlers/delete-supplier-feed-source.handler';
import { FeedIngestionProcessor } from '@/modules/feeds/processors/feed-ingestion.processor';

const Handlers = [
  FetchFeedUrlHandler,
  CheckFeedCollisionHandler,
  GetSupplierFeedSourcesHandler,
  GetAllFeedSourcesHandler,
  UpsertSupplierFeedSourceHandler,
  UpdateSupplierFeedSourceHandler,
  DeleteSupplierFeedSourceHandler,
];

@Module({
  imports: [
    CqrsModule,
    BullModule.registerQueue({
      name: 'feed-ingestion',
    }),
  ],
  controllers: [FeedsController],
  providers: [...Handlers, FeedIngestionProcessor],
  exports: [...Handlers],
})
export class FeedsModule {}
