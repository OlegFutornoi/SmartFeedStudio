import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

export const StorageSettingsTab: React.FC = () => {
  const { t } = useTranslation(['cloud', 'common']);
  const [autoSync, setAutoSync] = useState(false);
  const [webpCompress, setWebpCompress] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  const handleClearCache = () => {
    setIsClearing(true);
    setTimeout(() => {
      setIsClearing(false);
      setClearedMessage(t('cloud:cacheClearedSuccess'));
      setTimeout(() => setClearedMessage(null), 3000);
    }, 600);
  };

  return (
    <div data-testid="storage-settings-tab" className="space-y-4 max-w-3xl">
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">
            {t('cloud:syncPreferences')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Switch 1: Auto Sync on Feed Import */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60">
            <div className="space-y-0.5">
              <Label
                htmlFor="auto-sync-switch"
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                {t('cloud:autoSyncOnImport')}
              </Label>
              <p className="text-[11px] text-muted-foreground">{t('cloud:autoSyncOnImportDesc')}</p>
            </div>
            <Switch
              id="auto-sync-switch"
              data-testid="auto-sync-switch"
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
          </div>

          {/* Switch 2: WebP Compression */}
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60">
            <div className="space-y-0.5">
              <Label
                htmlFor="webp-compress-switch"
                className="text-xs font-medium text-foreground cursor-pointer"
              >
                {t('cloud:webpCompression')}
              </Label>
              <p className="text-[11px] text-muted-foreground">{t('cloud:webpCompressionDesc')}</p>
            </div>
            <Switch
              id="webp-compress-switch"
              data-testid="webp-compress-switch"
              checked={webpCompress}
              onCheckedChange={setWebpCompress}
            />
          </div>

          {/* Cache Cleanup Section */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground block">
                {t('cloud:clearLocalCache')}
              </span>
              <p className="text-[11px] text-muted-foreground">{t('cloud:clearLocalCacheDesc')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={isClearing}
              data-testid="clear-cache-btn"
              className="h-8 text-xs gap-1.5 shrink-0"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
              <span>{isClearing ? t('cloud:cacheClearing') : t('cloud:clearCacheBtn')}</span>
            </Button>
          </div>

          {clearedMessage && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{clearedMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
