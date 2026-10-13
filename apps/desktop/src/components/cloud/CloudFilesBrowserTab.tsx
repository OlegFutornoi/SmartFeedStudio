import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, FileQuestion, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import { getStorageFiles, deleteStorageFile } from '@/services/storage';
import type { StorageFileDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { TablePagination } from '@/components/ui/table-pagination';
import { CloudFilesTableRow } from '@/components/cloud/CloudFilesTableRow';
import { CloudOrphanCleanupDialog } from '@/components/cloud/CloudOrphanCleanupDialog';
import { emitDataSync } from '@/lib/syncEvents';

export const CloudFilesBrowserTab: React.FC = () => {
  const { t, language } = useTranslation(['cloud', 'common']);
  const { token } = useAuth();
  const { refetch: refreshQuota } = useStorageQuota();

  const [files, setFiles] = useState<StorageFileDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchFiles = useCallback(async () => {
    if (!token || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const res = await getStorageFiles(token, {
        page,
        limit: pageSize,
        folder: folder === 'all' ? undefined : folder,
        search: search.trim() || undefined,
      });
      setFiles(res.items);
      setTotal(res.total);
    } catch (err) {
      console.warn('[CloudFilesBrowserTab] Failed to fetch storage files:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [token, page, pageSize, folder, search]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleCopyUrl = (file: StorageFileDto) => {
    navigator.clipboard.writeText(file.publicUrl);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (fileId: string) => {
    if (!token) return;
    try {
      await deleteStorageFile(token, fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setTotal((prev) => Math.max(0, prev - 1));
      refreshQuota();
      emitDataSync(['storage', 'all'], { force: true });
    } catch (err) {
      console.warn('[CloudFilesBrowserTab] Failed to delete file:', err);
    }
  };

  return (
    <div data-testid="cloud-files-browser-tab" className="space-y-3">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('cloud:searchFilesPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>
          <Badge
            variant="secondary"
            className="text-[11px] font-mono tabular-nums shrink-0 h-8 px-2 flex items-center"
          >
            {total}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setFolder('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                folder === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('cloud:folderAll')}
            </button>
            <button
              type="button"
              onClick={() => {
                setFolder('images');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                folder === 'images'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('cloud:folderImages')}
            </button>
            <button
              type="button"
              onClick={() => {
                setFolder('snapshots');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                folder === 'snapshots'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('cloud:folderSnapshots')}
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCleanupDialogOpen(true)}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30"
            data-testid="open-orphan-cleanup-dialog-btn"
          >
            <Trash2 className="h-3 w-3" />
            <span>{t('cloud:cleanupOrphansBtn')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            disabled={isLoading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('cloud:refreshStats')}</span>
          </Button>
        </div>
      </div>

      {/* Files Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <Table className="text-xs">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-12 px-3 py-2 text-center">{t('cloud:previewCol')}</TableHead>
              <TableHead className="px-3 py-2">{t('cloud:fileKeyCol')}</TableHead>
              <TableHead className="px-3 py-2 w-28">{t('cloud:folderCol')}</TableHead>
              <TableHead className="px-3 py-2 w-24 text-right">{t('cloud:sizeCol')}</TableHead>
              <TableHead className="px-3 py-2 w-32">{t('cloud:uploadDateCol')}</TableHead>
              <TableHead className="px-3 py-2 w-24 text-right">{t('cloud:actionsCol')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-3 py-2 text-center">
                    <Skeleton className="h-8 w-8 rounded-md mx-auto" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <Skeleton className="h-6 w-14 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileQuestion className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-xs font-semibold text-foreground">
                      {t('cloud:noFilesFound')}
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm">
                      {t('cloud:noFilesDesc')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <CloudFilesTableRow
                  key={file.id}
                  file={file}
                  isCopied={copiedId === file.id}
                  onCopy={handleCopyUrl}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <TablePagination
          currentPage={page}
          totalPages={Math.ceil(total / pageSize) || 1}
          pageSize={pageSize}
          totalItems={total}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          isUk={language === 'uk'}
          testIdPrefix="cloud-files-pagination"
        />
      )}

      <CloudOrphanCleanupDialog
        open={isCleanupDialogOpen}
        onOpenChange={setIsCleanupDialogOpen}
        onCleaned={() => {
          fetchFiles();
          refreshQuota();
        }}
      />
    </div>
  );
};
