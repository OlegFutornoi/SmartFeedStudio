import type { CreateSupplierFeedSourceDto } from '@/modules/feeds/dto/feed-source.dto';

export class UpsertSupplierFeedSourceCommand {
  constructor(
    public readonly supplierId: string,
    public readonly userId: string,
    public readonly dto: CreateSupplierFeedSourceDto,
  ) {}
}
