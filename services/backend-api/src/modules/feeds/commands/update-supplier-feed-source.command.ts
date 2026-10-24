import type { UpdateSupplierFeedSourceDto } from '@/modules/feeds/dto/feed-source.dto';

export class UpdateSupplierFeedSourceCommand {
  constructor(
    public readonly supplierId: string,
    public readonly sourceId: string,
    public readonly userId: string,
    public readonly dto: UpdateSupplierFeedSourceDto,
  ) {}
}
