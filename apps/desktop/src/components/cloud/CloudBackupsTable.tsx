import React from 'react';
import { Database, Download, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useTranslation } from '@/i18n';
import { formatBytes } from '@/lib/formatters';
import type { StorageFileDto } from '@smartfeed/shared';

interface CloudBackupsTableProps {
  backups: StorageFileDto[];
  isRestoringId: string | null;
  isDeletingId: string | null;
  onRestore: (file: StorageFileDto) => void;
  onDelete: (fileId: string) => void;
}

export const CloudBackupsTable: React.FC<CloudBackupsTableProps> = ({
  backups,
  isRestoringId,
  isDeletingId,
  onRestore,
  onDelete,
}) => {
  const { t } = useTranslation(['cloud', 'common']);

  if (backups.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-dashed border-border bg-card text-center space-y-2">
        <Database className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
        <p className="text-xs font-semibold text-foreground">{t('cloud:emptyBackupsList')}</p>
        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
          {t('cloud:emptyBackupsListDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="h-8 bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-[11px] font-medium text-muted-foreground px-3">
              {t('cloud:fileKeyCol')}
            </TableHead>
            <TableHead className="text-[11px] font-medium text-muted-foreground px-3">
              {t('cloud:sizeCol')}
            </TableHead>
            <TableHead className="text-[11px] font-medium text-muted-foreground px-3">
              {t('cloud:uploadDateCol')}
            </TableHead>
            <TableHead className="text-[11px] font-medium text-muted-foreground px-3 text-right">
              {t('cloud:actionsCol')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.map((file) => (
            <TableRow
              key={file.id}
              data-testid={`backup-row-${file.id}`}
              className="h-10 hover:bg-muted/30"
            >
              <TableCell className="px-3 font-medium text-foreground text-xs">
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[280px]" title={file.originalName}>
                    {file.originalName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-3 text-xs text-muted-foreground font-mono">
                {formatBytes(file.sizeBytes)}
              </TableCell>
              <TableCell className="px-3 text-xs text-muted-foreground tabular-nums">
                {new Date(file.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="px-3 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(file)}
                    disabled={isRestoringId === file.id}
                    data-testid={`restore-backup-btn-${file.id}`}
                    className="h-7 text-[11px] px-2 gap-1 text-primary hover:text-primary"
                  >
                    <RotateCcw
                      className={`h-3 w-3 ${isRestoringId === file.id ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isRestoringId === file.id
                        ? t('cloud:restoringCatalog')
                        : t('cloud:restoreCatalogBtn')}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.publicUrl, '_blank')}
                    title={t('cloud:downloadBackup')}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(file.id)}
                    disabled={isDeletingId === file.id}
                    title={t('cloud:deleteBackup')}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
