import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Database,
  Cloud,
  Download,
  ArrowUpCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import { localProductsService, localSuppliersService } from '@/services/local-db';
import { getStorageFiles, uploadDirectToS3, deleteStorageFile } from '@/services/storage';
import { CloudBackupsCards } from '@/components/cloud/CloudBackupsCards';
import { CloudBackupsTable } from '@/components/cloud/CloudBackupsTable';
import type { StorageFileDto } from '@smartfeed/shared';

export const CloudBackupsTab: React.FC = () => {
  const { t } = useTranslation(['cloud', 'common']);
  const { token: accessToken } = useAuth();
  const { refetch: refreshQuota } = useStorageQuota();

  const [productsCount, setProductsCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [backups, setBackups] = useState<StorageFileDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const isMountedRef = useRef(true);

  // Load catalog summary and backups list
  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [prodsRes, catsRes, filesRes] = await Promise.all([
        localProductsService.getProducts({ limit: 5000 }),
        localProductsService.getCategoriesSummary(),
        getStorageFiles(accessToken, { folder: 'snapshots', page: 1, limit: 20 }),
      ]);

      if (isMountedRef.current) {
        setProductsCount(prodsRes.total || prodsRes.items?.length || 0);
        setCategoriesCount(catsRes?.length || 0);
        setBackups(filesRes.items || []);
      }
    } catch (err) {
      console.warn('[CloudBackupsTab] Failed to load backup info:', err);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  // Generate catalog snapshot payload
  const createBackupPayload = async () => {
    const [prodsRes, cats, sups] = await Promise.all([
      localProductsService.getProducts({ limit: 5000 }),
      localProductsService.getCategoriesSummary(),
      localSuppliersService.getSuppliers(),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      productsCount: prodsRes.items?.length || 0,
      categoriesCount: cats?.length || 0,
      products: prodsRes.items || [],
      categories: cats || [],
      suppliers: sups || [],
    };
  };

  // Create cloud backup
  const handleCreateCloudBackup = async () => {
    if (!accessToken) return;
    setIsCreating(true);
    setFeedback(null);

    try {
      const payload = await createBackupPayload();
      const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const dateTag = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `catalog_backup_${dateTag}.json`;

      await uploadDirectToS3({
        file: jsonBlob,
        fileName,
        contentType: 'application/json',
        folder: 'snapshots',
        accessToken,
      });

      await Promise.all([loadData(), refreshQuota()]);
      setFeedback({ message: t('cloud:backupCreatedSuccess') });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ message: msg, isError: true });
    } finally {
      setIsCreating(false);
    }
  };

  // Download backup directly to computer
  const handleDownloadLocalFile = async () => {
    try {
      const payload = await createBackupPayload();
      const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const dateTag = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `catalog_backup_${dateTag}.json`;

      const downloadUrl = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.warn('[CloudBackupsTab] Failed to download local backup:', err);
    }
  };

  // Restore catalog from cloud backup file
  const handleRestoreBackup = async (file: StorageFileDto) => {
    setIsRestoringId(file.id);
    setFeedback(null);

    try {
      const res = await fetch(file.publicUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to download backup`);
      const data = await res.json();

      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        await localProductsService.bulkUpsert(data.products);
      }

      await loadData();
      setFeedback({ message: `${t('cloud:restoreSuccess')} (${file.originalName})` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ message: msg, isError: true });
    } finally {
      setIsRestoringId(null);
    }
  };

  // Delete cloud backup
  const handleDeleteBackup = async (fileId: string) => {
    if (!accessToken) return;
    setIsDeletingId(fileId);
    try {
      await deleteStorageFile(accessToken, fileId);
      await Promise.all([loadData(), refreshQuota()]);
    } catch (err) {
      console.warn('[CloudBackupsTab] Failed to delete backup:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div data-testid="cloud-backups-tab" className="space-y-4">
      {/* 3 Status Cards (Modular Subcomponent) */}
      <CloudBackupsCards
        productsCount={productsCount}
        categoriesCount={categoriesCount}
        latestBackup={backups[0]}
      />

      {/* Primary Actions Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5 max-w-xl">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>{t('cloud:backupCatalogTitle')}</span>
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t('cloud:backupCatalogDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadLocalFile}
            data-testid="download-local-backup-btn"
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t('cloud:downloadLocalBackupBtn')}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleCreateCloudBackup}
            disabled={isCreating}
            data-testid="create-snapshot-btn"
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <ArrowUpCircle className={`h-3.5 w-3.5 ${isCreating ? 'animate-spin' : ''}`} />
            <span>{isCreating ? t('cloud:creatingBackupBtn') : t('cloud:createBackupBtn')}</span>
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          data-testid="backup-feedback-banner"
          className={`rounded-xl border p-3 flex items-center gap-2.5 text-xs animate-in fade-in duration-200 ${
            feedback.isError
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {feedback.isError ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Cloud Backups History Section (Modular Subcomponent) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-primary" />
            <span>{t('cloud:backupsHistoryTitle')}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {backups.length}
            </Badge>
          </h4>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('cloud:refreshStats')}</span>
          </Button>
        </div>

        <CloudBackupsTable
          backups={backups}
          isRestoringId={isRestoringId}
          isDeletingId={isDeletingId}
          onRestore={handleRestoreBackup}
          onDelete={handleDeleteBackup}
        />
      </div>
    </div>
  );
};
