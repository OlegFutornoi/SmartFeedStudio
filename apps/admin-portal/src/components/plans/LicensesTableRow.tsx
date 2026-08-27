'use client';

import React from 'react';
import { TableCell, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Cloud, CheckCircle2, PauseCircle, AlertCircle, KeyRound } from 'lucide-react';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { LicenseRowActions } from './LicenseRowActions';
import { cn } from '../../lib/utils';

interface LicensesTableRowProps {
  license: AdminLicenseItemDto;
  isUk: boolean;
  now: Date;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (license: AdminLicenseItemDto) => void;
}

export const LicensesTableRow = React.memo(function LicensesTableRow({
  license: lic,
  isUk,
  now,
  onStatusChange,
  onOpenDelete,
}: LicensesTableRowProps) {
  const isExpired = Boolean(lic.expiresAt) && new Date(lic.expiresAt!) <= now;
  const isSuspended = !lic.isActive;
  const isCurrentActive = lic.isActive && !isExpired;

  return (
    <TableRow
      key={lic.id}
      data-testid={`license-row-${lic.licenseKey}`}
      className={cn(
        'transition-colors',
        isCurrentActive
          ? 'hover:bg-emerald-500/[0.04] bg-emerald-500/[0.02] border-l-2 border-l-emerald-500'
          : isSuspended
            ? 'hover:bg-muted/40 bg-muted/10'
            : 'hover:bg-muted/40',
      )}
    >
      {/* License Key */}
      <TableCell className="font-mono text-xs font-semibold text-foreground">
        <span
          data-testid={`license-key-badge-${lic.licenseKey}`}
          className={cn(
            'p-1 px-1.5 rounded border text-xs',
            isCurrentActive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'bg-muted/40 border-border/50',
          )}
        >
          {lic.licenseKey}
        </span>
      </TableCell>

      {/* User */}
      <TableCell className="text-xs">
        <div className="flex flex-col">
          <span
            data-testid={`license-user-name-${lic.licenseKey}`}
            className="font-medium text-foreground"
          >
            {lic.user?.fullName || 'User'}
          </span>
          <span
            data-testid={`license-user-email-${lic.licenseKey}`}
            className="text-[11px] text-muted-foreground font-mono"
          >
            {lic.user?.email}
          </span>
        </div>
      </TableCell>

      {/* Plan Tier */}
      <TableCell>
        <Badge
          variant="outline"
          data-testid={`license-plan-badge-${lic.licenseKey}`}
          className={
            lic.planType === 'ENTERPRISE'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-medium text-xs'
              : lic.planType === 'PRO'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-medium text-xs'
                : 'bg-secondary text-secondary-foreground font-medium text-xs'
          }
        >
          <KeyRound className="h-3 w-3 mr-1" />
          {lic.planType}
        </Badge>
      </TableCell>

      {/* Status Badge */}
      <TableCell>
        {isSuspended ? (
          <Badge
            variant="outline"
            data-testid={`license-status-badge-${lic.licenseKey}`}
            className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] gap-1 px-1.5 py-0 font-medium"
          >
            <PauseCircle className="size-2.5" />
            <span>{isUk ? 'Призупинена' : 'Suspended'}</span>
          </Badge>
        ) : isExpired ? (
          <Badge
            variant="outline"
            data-testid={`license-status-badge-${lic.licenseKey}`}
            className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] gap-1 px-1.5 py-0 font-medium"
          >
            <AlertCircle className="size-2.5" />
            <span>{isUk ? 'Закінчилася' : 'Expired'}</span>
          </Badge>
        ) : (
          <Badge
            variant="outline"
            data-testid={`license-status-badge-${lic.licenseKey}`}
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] gap-1 px-1.5 py-0 font-medium"
          >
            <CheckCircle2 className="size-2.5" />
            <span>{isUk ? 'Активна' : 'Active'}</span>
          </Badge>
        )}
      </TableCell>

      {/* XML Limit */}
      <TableCell
        data-testid={`license-xml-limit-${lic.licenseKey}`}
        className="text-xs text-muted-foreground font-mono"
      >
        {lic.maxXmlLimit.toLocaleString()}
      </TableCell>

      {/* AI Credits */}
      <TableCell
        data-testid={`license-ai-credits-${lic.licenseKey}`}
        className="text-xs text-muted-foreground font-mono"
      >
        {lic.aiCredits.toLocaleString()}
      </TableCell>

      {/* Cloud Backup */}
      <TableCell>
        {lic.canCloudBackup ? (
          <Badge
            variant="secondary"
            data-testid={`license-cloud-badge-${lic.licenseKey}`}
            className="text-[10px] gap-1 px-1.5 py-0"
          >
            <Cloud className="size-2.5 text-muted-foreground" />
            <span>S3 Active</span>
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Expiry Date */}
      <TableCell
        data-testid={`license-expiry-${lic.licenseKey}`}
        className="text-xs text-muted-foreground font-mono"
      >
        {lic.expiresAt
          ? new Date(lic.expiresAt).toLocaleDateString()
          : isUk
            ? 'Безстроково'
            : 'Lifetime'}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <LicenseRowActions
          license={lic}
          isUk={isUk}
          onStatusChange={onStatusChange}
          onOpenDelete={onOpenDelete}
        />
      </TableCell>
    </TableRow>
  );
});
