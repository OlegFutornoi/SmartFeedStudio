import { FeedSourceType } from '@smartfeed/shared';

export class ImportFeedContentCommand {
  constructor(
    public readonly userId: string,
    public readonly supplierId: string,
    public readonly feedContent: string,
    public readonly catalogId?: string,
    public readonly sourceType: FeedSourceType = FeedSourceType.URL,
    public readonly sourceUrl?: string,
    public readonly fileName?: string,
  ) {}
}
