import { BulkDeleteProductsDto } from '@smartfeed/shared';

export class BulkDeleteProductsCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: BulkDeleteProductsDto,
  ) {}
}
