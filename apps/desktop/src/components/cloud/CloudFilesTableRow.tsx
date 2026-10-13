import React from 'react';
import { Copy, Check, Trash2, Folder, ExternalLink } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StorageFileDto } from '@smartfeed/shared';
import { formatBytes } from '@/lib/formatters';
import { useTranslation } from '@/i18n';

export interface CloudFilesTableRowProps {
  file: StorageFileDto;
  isCopied: boolean;
  onCopy: (file: StorageFileDto) => void;
  onDelete: (fileId: string) => void;
}

export const CloudFilesTableRow: React.FC<CloudFilesTableRowProps> = ({
  file,
  isCopied,
  onCopy,
  onDelete,
}) => {
  const { t } = useTranslation(['cloud']);

  return (
    <TableRow key={file.id} className="hover:bg-muted/30">
      <TableCell className="px-3 py-2 text-center">
        {file.mimeType.startsWith('image/') ? (
          <img
            src={file.publicUrl}
            alt={file.originalName}
            className="h-8 w-8 rounded-md object-cover border border-border mx-auto"
          />
        ) : (
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Folder className="h-4 w-4" />
          </div>
        )}
      </TableCell>
      <TableCell className="px-3 py-2 font-mono text-[11px]">
        <span
          className="font-semibold text-foreground block truncate max-w-xs"
          title={file.originalName}
        >
          {file.originalName}
        </span>
        <span
          className="text-muted-foreground text-[10px] block truncate max-w-xs"
          title={file.s3Key}
        >
          {file.s3Key}
        </span>
      </TableCell>
      <TableCell className="px-3 py-2">
        <Badge variant="outline" className="text-[10px] font-mono">
          {file.s3Key.split('/')[0] || 'other'}
        </Badge>
      </TableCell>
      <TableCell className="px-3 py-2 text-right font-mono text-[11px] tabular-nums">
        {formatBytes(file.sizeBytes)}
      </TableCell>
      <TableCell className="px-3 py-2 text-[11px] text-muted-foreground">
        {new Date(file.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCopy(file)}
            title={t('cloud:copyPublicUrl')}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            {isCopied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <a
            href={file.publicUrl}
            target="_blank"
            rel="noreferrer"
            title={t('cloud:openUrl')}
            className="p-1 rounded text-muted-foreground hover:text-foreground inline-flex items-center"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(file.id)}
            title={t('cloud:deleteFile')}
            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
