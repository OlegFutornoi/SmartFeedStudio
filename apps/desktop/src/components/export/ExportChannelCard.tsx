import { useState } from 'react';
import { Copy, Check, Download, Percent, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExportChannelDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface ExportChannelCardProps {
  channel: ExportChannelDto;
  onEdit?: (channel: ExportChannelDto) => void;
  onDelete?: (channelId: string) => void;
}

export function ExportChannelCard({ channel, onEdit, onDelete }: ExportChannelCardProps) {
  const { t } = useTranslation(['export', 'common']);
  const [isCopied, setIsCopied] = useState(false);

  const fullFeedUrl =
    channel.exportUrl || `${window.location.origin}/api/export/${channel.slug || channel.id}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullFeedUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.warn('[ExportChannelCard] Failed to copy URL to clipboard:', err);
    }
  };

  const handleDownload = () => {
    window.open(fullFeedUrl, '_blank');
  };

  const getMarketplaceBadgeColor = (_code: string) => {
    return 'bg-secondary text-secondary-foreground border-border';
  };

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-md hover:border-primary/40 transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold text-foreground truncate max-w-[200px]">
                {channel.name}
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono tracking-wider shrink-0 ${getMarketplaceBadgeColor(
                  channel.marketplaceCode,
                )}`}
              >
                {channel.marketplaceCode}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {channel.catalogName
                ? t('export:catalogLabel', { name: channel.catalogName })
                : t('export:allProducts')}
            </p>
          </div>

          <Badge
            variant={channel.isActive ? 'default' : 'outline'}
            className={`text-[10px] shrink-0 font-medium px-2 py-0.5 ${
              channel.isActive ? 'bg-foreground text-background' : 'text-muted-foreground'
            }`}
          >
            {channel.isActive ? t('export:statusActive') : t('export:statusDisabled')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Commission & Economics Pill */}
        <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground flex items-center gap-1.5 font-sans font-medium">
            <Percent className="size-3.5 text-primary shrink-0" />
            {t('export:commissionLabel')}
          </span>
          <span className="font-semibold text-foreground">
            {channel.commissionPercent}%{' '}
            {channel.extraFixedCost > 0 && `(+${channel.extraFixedCost} ₴)`}
          </span>
        </div>

        {/* Reverse Markup Indicator */}
        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="text-muted-foreground">{t('export:markupFormulaLabel')}</span>
          {channel.applyReverseMarkup ? (
            <Badge
              variant="outline"
              className="text-[10px] bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
            >
              <Sparkles className="size-3" />
              {t('export:reverseMarkupBadge')}
            </Badge>
          ) : (
            <span className="text-muted-foreground">{t('export:standardMarkup')}</span>
          )}
        </div>

        {/* Live Feed URL Copy Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{t('export:liveFeedLink')}</span>
            <span className="font-mono">{channel.feedFormat}</span>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-background border border-border/80">
            <input
              type="text"
              readOnly
              value={fullFeedUrl}
              className="bg-transparent text-[11px] font-mono text-muted-foreground flex-1 px-1 outline-none truncate"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyUrl}
              className="size-6 text-muted-foreground hover:text-foreground shrink-0"
              title={t('export:copyFeedLink')}
              data-testid={`copy-feed-url-btn-${channel.id}`}
            >
              {isCopied ? (
                <Check className="size-3 text-foreground" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1 text-xs h-8 bg-secondary/40 border-border/80 hover:bg-secondary hover:text-foreground font-medium flex items-center justify-center gap-1.5 truncate"
            title={t('export:downloadTooltip')}
            data-testid={`download-feed-btn-${channel.id}`}
          >
            <Download className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{t('export:downloadFeed')}</span>
          </Button>

          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60"
                onClick={() => onEdit(channel)}
                title={t('common:edit', { defaultValue: 'Редагувати' })}
                data-testid={`edit-export-channel-btn-${channel.id}`}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={() => onDelete(channel.id)}
                title={t('common:delete', { defaultValue: 'Видалити' })}
                data-testid={`delete-export-channel-btn-${channel.id}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
