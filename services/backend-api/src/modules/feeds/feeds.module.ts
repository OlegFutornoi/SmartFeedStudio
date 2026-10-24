import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FeedsController } from '@/modules/feeds/feeds.controller';
import { FetchFeedUrlHandler } from '@/modules/feeds/queries/handlers/fetch-feed-url.handler';
import { CheckFeedCollisionHandler } from '@/modules/feeds/queries/handlers/check-feed-collision.handler';
import { GetSupplierFeedSourcesHandler } from '@/modules/feeds/queries/handlers/get-supplier-feed-sources.handler';
import { GetAllFeedSourcesHandler } from '@/modules/feeds/queries/handlers/get-all-feed-sources.handler';
import { UpsertSupplierFeedSourceHandler } from '@/modules/feeds/commands/handlers/upsert-supplier-feed-source.handler';
import { UpdateSupplierFeedSourceHandler } from '@/modules/feeds/commands/handlers/update-supplier-feed-source.handler';
import { DeleteSupplierFeedSourceHandler } from '@/modules/feeds/commands/handlers/delete-supplier-feed-source.handler';

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
  imports: [CqrsModule],
  controllers: [FeedsController],
  providers: [...Handlers],
  exports: [...Handlers],
})
export class FeedsModule {}
