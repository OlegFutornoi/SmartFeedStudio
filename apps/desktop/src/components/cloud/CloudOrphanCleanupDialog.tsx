import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import { cleanupStorageOrphans, invalidateStorageQuotaCache } from '@/services/storage';
import { localProductsService } from '@/services/local-db';
import { emitDataSync } from '@/lib/syncEvents';
import { formatBytes } from '@/lib/formatters';
import { useTranslation } from '@/i18n';
import type { CleanupOrphansResponseDto } from '@smartfeed/shared';

interface CloudOrphanCleanupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleaned?: () => void;
}

export const CloudOrphanCleanupDialog: React.FC<CloudOrphanCleanupDialogProps> = ({
  open,
  onOpenChange,
  onCleaned,
}) => {
  const { t } = useTranslation(['cloud', 'common']);
  const { token } = useAuth();
  const { runBackgroundTask } = useBackgroundJobs();

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CleanupOrphansResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Retrieve active S3 keys of images still referenced in local catalog
  const getCatalogActiveKeys = async (): Promise<string[]> => {
    try {
      const prods = await localProductsService.getProducts({ limit: 10000 });
      const keys: string[] = [];
      for (const item of prods.items || []) {
        for (const img of item.images || []) {
          if (img.s3Key) keys.push(img.s3Key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  };

  // Scan orphans when dialog opens
  useEffect(() => {
    if (!open || !token) {
      setScanResult(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsScanning(true);
    setError(null);

    getCatalogActiveKeys()
      .then((activeKeys) => {
        if (!isMounted) return null;
        return cleanupStorageOrphans(token, { dryRun: true, folder: 'images', activeKeys });
      })
      .then((res) => {
        if (isMounted && res) setScanResult(res);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) setIsScanning(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, token]);

  const handlePurge = () => {
    if (!token || !scanResult || scanResult.orphanCount === 0) return;

    const orphanCount = scanResult.orphanCount;

    // Close modal immediately so the user does NOT have to wait
    onOpenChange(false);

    runBackgroundTask({
      kind: 'CLEANUP_ORPHANS',
      title: t('cloud:cleanupOrphansTitle'),
      subtitle: `${t('cloud:purgingOrphans')} (${orphanCount} ${t('cloud:photosPending')})`,
      totalItems: orphanCount,
      action: async () => {
        const activeKeys = await getCatalogActiveKeys();
        const res = await cleanupStorageOrphans(token, {
          dryRun: false,
          folder: 'images',
          activeKeys,
        });

        invalidateStorageQuotaCache();
        emitDataSync(['storage', 'quotas', 'licenses', 'all'], { force: true });
        onCleaned?.();
        return res;
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="orphan-cleanup-dialog" className="sm:max-w-md bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">
                {t('cloud:cleanupOrphansTitle')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t('cloud:cleanupOrphansDesc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {error && (
            <Alert variant="destructive" className="py-2 text-xs">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>{t('cloud:scanningOrphans')}</span>
            </div>
          ) : scanResult && scanResult.orphanCount > 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('cloud:orphansFoundCount')}:</span>
                <Badge variant="destructive" className="text-xs px-2 py-0.5 font-mono">
                  {scanResult.orphanCount}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t('cloud:orphansFoundSize')}:</span>
                <span className="font-semibold text-foreground">
                  {formatBytes(scanResult.orphanSizeBytes)}
                </span>
              </div>

              {scanResult.deletedKeys.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">
                    Приклади незв'язаних файлів:
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[10px] text-muted-foreground bg-background/50 p-2 rounded border border-border">
                    {scanResult.deletedKeys.slice(0, 5).map((key) => (
                      <div key={key} className="truncate">
                        {key.split('/').pop()}
                      </div>
                    ))}
                    {scanResult.deletedKeys.length > 5 && (
                      <div className="text-primary font-sans pt-1">
                        + ще {scanResult.deletedKeys.length - 5} файлів...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            !isScanning && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{t('cloud:noOrphansFound')}</span>
              </div>
            )
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            {t('common:close')}
          </Button>

          {scanResult && scanResult.orphanCount > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handlePurge}
              className="text-xs h-8 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('cloud:purgeInBackground')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
