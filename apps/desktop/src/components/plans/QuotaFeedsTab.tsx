import React from 'react';
import { Radio, Globe, FileText, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SupplierDto } from '@smartfeed/shared';
import type { FeedSourceItemDto } from '@/lib/api';
import { formatFeedDisplay } from './quota-reconciliation.utils';

interface QuotaFeedsTabProps {
  feedSources: { supplier: SupplierDto; feed: FeedSourceItemDto }[];
  deletingIds: Set<string>;
  isUk: boolean;
  onDeleteFeed: (supplierId: string, feed: FeedSourceItemDto) => void;
}

export const QuotaFeedsTab: React.FC<QuotaFeedsTabProps> = ({
  feedSources,
  deletingIds,
  isUk,
  onDeleteFeed,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {isUk
          ? 'Видалення фіду звільняє імпортовані товари за квотою.'
          : 'Deleting a feed removes its imported products to free up quota.'}
      </p>

      <div className="space-y-2">
        {feedSources.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
            <Radio className="h-6 w-6 mx-auto mb-2 opacity-50" />
            {isUk ? 'Немає підключених фідів' : 'No connected feeds'}
          </div>
        ) : (
          feedSources.map(({ supplier, feed }) => {
            const { title, subtitle, showSubtitle } = formatFeedDisplay(
              feed.name,
              feed.sourceUrl,
              feed.s3FileKey,
            );
            const isUrl = feed.sourceType === 'URL' || Boolean(feed.sourceUrl);
            const isItemDeleting = deletingIds.has(feed.id);

            return (
              <div
                key={feed.id}
                className={`p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all flex items-center justify-between gap-3 shadow-sm ${
                  isItemDeleting ? 'opacity-60 bg-muted/30' : ''
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isUrl ? (
                      <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                    <span
                      className="font-semibold text-xs text-foreground truncate max-w-[260px] sm:max-w-[320px]"
                      title={feed.name}
                    >
                      {title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono uppercase bg-background px-1.5 py-0"
                    >
                      {feed.fileFormat}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {supplier.name}
                    </Badge>
                    {isItemDeleting && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] animate-pulse px-1.5 py-0"
                      >
                        {isUk ? 'Видаляється...' : 'Deleting...'}
                      </Badge>
                    )}
                  </div>

                  {showSubtitle && (
                    <p
                      className="text-[11px] text-muted-foreground truncate font-mono max-w-[360px] sm:max-w-[440px]"
                      title={subtitle}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  disabled={isItemDeleting}
                  onClick={() => onDeleteFeed(supplier.id, feed)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 transition-colors"
                  title={
                    isUk ? 'Видалити фід та всі його товари' : 'Delete feed and associated products'
                  }
                  aria-label={isUk ? 'Видалити фід' : 'Delete feed'}
                  data-testid={`delete-feed-btn-${feed.id}`}
                >
                  {isItemDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
