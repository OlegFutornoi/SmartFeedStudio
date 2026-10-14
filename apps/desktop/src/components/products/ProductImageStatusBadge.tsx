import React from 'react';
import { Cloud, HardDrive, Globe, AlertCircle, Loader2 } from 'lucide-react';
import {
  ImageSyncStatus,
  ImageDownloadStatus,
  type LocalProductImageDto,
  type ProductImageDto,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ProductImageStatusBadgeProps {
  image?: LocalProductImageDto | ProductImageDto | null;
  size?: 'xs' | 'sm';
  showLabel?: boolean;
  className?: string;
}

export const ProductImageStatusBadge: React.FC<ProductImageStatusBadgeProps> = ({
  image,
  size = 'xs',
  showLabel = false,
  className = '',
}) => {
  const { t } = useTranslation(['catalogs']);

  if (!image) return null;

  const syncStatus = 'syncStatus' in image ? image.syncStatus : undefined;

  const isCloud =
    syncStatus === ImageSyncStatus.SYNCED || Boolean(image.cloudUrl) || Boolean(image.s3Key);

  const isQueued = syncStatus === ImageSyncStatus.QUEUED_FOR_UPLOAD;
  const isError =
    syncStatus === ImageSyncStatus.SYNC_ERROR || image.status === ImageDownloadStatus.FAILED;

  const isLocal =
    Boolean(image.localPath) ||
    Boolean(image.thumbnailPath) ||
    image.status === ImageDownloadStatus.READY;

  let config = {
    icon: <Globe className="h-2.5 w-2.5" />,
    label: t('catalogs:badgeSupplierUrl'),
    tooltip: t('catalogs:tooltipSupplierUrl'),
    classes: 'bg-muted/90 text-muted-foreground border-border/80',
    iconColor: 'text-muted-foreground',
  };

  if (isCloud) {
    config = {
      icon: <Cloud className="h-2.5 w-2.5" />,
      label: t('catalogs:badgeCloudR2'),
      tooltip: t('catalogs:tooltipCloudR2'),
      classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      iconColor: 'text-emerald-500',
    };
  } else if (isQueued) {
    config = {
      icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />,
      label: t('catalogs:badgeSyncing'),
      tooltip: t('catalogs:tooltipSyncing'),
      classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      iconColor: 'text-amber-500',
    };
  } else if (isError) {
    config = {
      icon: <AlertCircle className="h-2.5 w-2.5" />,
      label: t('catalogs:badgeError'),
      tooltip: t('catalogs:tooltipError'),
      classes: 'bg-destructive/10 text-destructive border-destructive/30',
      iconColor: 'text-destructive',
    };
  } else if (isLocal) {
    config = {
      icon: <HardDrive className="h-2.5 w-2.5" />,
      label: t('catalogs:badgeLocalOnly'),
      tooltip: t('catalogs:tooltipLocalOnly'),
      classes: 'bg-primary/10 text-primary border-primary/25',
      iconColor: 'text-primary',
    };
  }

  const iconOnlyPadding = size === 'xs' ? 'p-1' : 'p-1.5';
  const withLabelPadding = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            data-testid="product-image-status-badge"
            className={`inline-flex items-center gap-1 rounded-md border font-mono font-medium text-2xs leading-none shadow-xs backdrop-blur-xs transition-colors cursor-help ${
              showLabel ? withLabelPadding : iconOnlyPadding
            } ${config.classes} ${className}`}
          >
            <span className={config.iconColor}>{config.icon}</span>
            {showLabel && <span>{config.label}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-xs font-sans">
          <p>{config.tooltip}</p>
          {isCloud && image.cloudUrl && (
            <p className="text-2xs text-muted-foreground mt-0.5 font-mono truncate max-w-[200px]">
              {image.cloudUrl}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
