'use client';

import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Cloud, KeyRound } from 'lucide-react';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { LicenseRowActions } from '@/components/plans/LicenseRowActions';
import { UserAvatarCell } from '@/components/ui/user-avatar-cell';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

interface LicensesTableRowProps {
  license: AdminLicenseItemDto;
  isUk: boolean;
  now: Date;
  visibleColumns?: Record<string, boolean>;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (license: AdminLicenseItemDto) => void;
}

export const LicensesTableRow = React.memo(function LicensesTableRow({
  license: lic,
  isUk,
  now,
  visibleColumns = {},
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
        'transition-colors hover:bg-muted/40',
        isCurrentActive && 'border-l-2 border-l-primary',
      )}
    >
      {/* License Key (always visible) */}
      <TableCell className="font-mono text-xs font-semibold text-foreground">
        <span
          data-testid={`license-key-badge-${lic.licenseKey}`}
          className={cn(
            'p-1 px-1.5 rounded border text-xs',
            isCurrentActive
              ? 'bg-primary/10 border-primary/20 text-primary font-semibold'
              : 'bg-muted/40 border-border/50 text-muted-foreground',
          )}
        >
          {lic.licenseKey}
        </span>
      </TableCell>

      {/* User (always visible) */}
      <TableCell className="text-xs">
        <UserAvatarCell
          fullName={lic.user?.fullName}
          email={lic.user?.email}
          avatarUrl={lic.user?.avatarUrl}
          size="md"
          showEmail
        />
      </TableCell>

      {/* Plan Tier */}
      {visibleColumns.tier !== false && (
        <TableCell>
          <Badge
            variant="outline"
            data-testid={`license-plan-badge-${lic.licenseKey}`}
            className={
              lic.planType === 'ENTERPRISE'
                ? 'bg-primary/15 text-primary border-primary/30 font-medium text-2xs h-5'
                : lic.planType === 'PRO'
                  ? 'bg-muted text-foreground border-border font-medium text-2xs h-5'
                  : 'bg-secondary text-secondary-foreground font-medium text-2xs h-5'
            }
          >
            <KeyRound className="h-3 w-3 mr-1" />
            {lic.planType}
          </Badge>
        </TableCell>
      )}

      {/* Status Badge */}
      {visibleColumns.status !== false && (
        <TableCell>
          <StatusBadge
            status={isSuspended ? 'SUSPENDED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
            label={
              isSuspended
                ? isUk
                  ? 'Призупинена'
                  : 'Suspended'
                : isExpired
                  ? isUk
                    ? 'Закінчилася'
                    : 'Expired'
                  : isUk
                    ? 'Активна'
                    : 'Active'
            }
            testId={`license-status-badge-${lic.licenseKey}`}
            isUk={isUk}
          />
        </TableCell>
      )}

      {/* XML Limit */}
      {visibleColumns.xmlLimit !== false && (
        <TableCell
          data-testid={`license-xml-limit-${lic.licenseKey}`}
          className="text-xs text-muted-foreground font-mono"
        >
          {lic.maxXmlLimit.toLocaleString()}
        </TableCell>
      )}

      {/* AI Credits */}
      {visibleColumns.aiCredits !== false && (
        <TableCell
          data-testid={`license-ai-credits-${lic.licenseKey}`}
          className="text-xs text-muted-foreground font-mono"
        >
          {lic.aiCredits.toLocaleString()}
        </TableCell>
      )}

      {/* Cloud Backup */}
      {visibleColumns.cloudBackup !== false && (
        <TableCell>
          {lic.canCloudBackup ? (
            <Badge
              variant="secondary"
              data-testid={`license-cloud-badge-${lic.licenseKey}`}
              className="text-2xs h-5 gap-1 px-1.5 py-0"
            >
              <Cloud className="size-2.5 text-muted-foreground" />
              <span>S3 Active</span>
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      )}

      {/* Expiry Date */}
      {visibleColumns.expiresAt !== false && (
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
      )}

      {/* Actions (always visible) */}
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
