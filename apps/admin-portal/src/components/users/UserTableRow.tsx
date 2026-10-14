'use client';

import React from 'react';
import {
  KeyRound,
  Building2,
  Users as UsersIcon,
  Shield,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { UserListItemDto } from '@smartfeed/shared';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRowActions } from '@/components/users/UserRowActions';
import { UserAvatarCell } from '@/components/ui/user-avatar-cell';
import { StatusBadge } from '@/components/ui/status-badge';

interface UserTableRowProps {
  user: UserListItemDto;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (user: UserListItemDto) => void;
  onOpenTeam?: (user: UserListItemDto) => void;
  visibleColumns?: Record<string, boolean>;
}

export const UserTableRow = React.memo(function UserTableRow({
  user,
  isExpanded = false,
  onToggleExpand,
  onStatusChange,
  onOpenDelete,
  onOpenTeam,
  visibleColumns,
}: UserTableRowProps) {
  const { t, locale } = useLanguage();
  const isActive = user.isActive !== false;
  const hasMembers = Boolean(user.teamMembers && user.teamMembers.length > 0);

  return (
    <TableRow
      data-testid={`user-table-row-${user.id}`}
      className="hover:bg-muted/40 transition-colors group"
    >
      {/* User Info */}
      <TableCell>
        <div className="flex items-center space-x-2">
          {hasMembers && onToggleExpand ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid={`user-row-expand-btn-${user.id}`}
              onClick={onToggleExpand}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
              title={isExpanded ? t('users', 'collapse_team') : t('users', 'expand_team')}
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5 text-primary" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </Button>
          ) : (
            <div className="w-6 shrink-0" />
          )}

          <UserAvatarCell
            fullName={user.fullName}
            email={user.email}
            avatarUrl={user.avatarUrl}
            size="md"
            showEmail
          />
        </div>
      </TableCell>

      {/* Role */}
      {visibleColumns?.role !== false && (
        <TableCell>
          {user.role === 'ADMIN' ? (
            <Badge
              data-testid="user-row-role-admin"
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 text-2xs h-5 px-1.5 py-0 font-medium"
            >
              <Shield className="h-2.5 w-2.5 mr-1" />
              {t('users', 'role_admin')}
            </Badge>
          ) : (
            <Badge
              data-testid="user-row-role"
              variant="outline"
              className="bg-secondary text-secondary-foreground text-2xs h-5 px-1.5 py-0 font-medium"
            >
              {t('users', 'role_user')}
            </Badge>
          )}
        </TableCell>
      )}

      {/* Team / Organization */}
      {visibleColumns?.team !== false && (
        <TableCell>
          {user.organization ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5">
                <span
                  className="text-xs font-medium text-foreground truncate max-w-[150px]"
                  title={user.organization.organizationName}
                >
                  {user.organization.organizationName}
                </span>

                {user.organization.isOwner && (
                  <Badge
                    data-testid="user-row-role-owner"
                    variant="outline"
                    className="bg-muted text-muted-foreground border-border text-2xs h-5 font-medium py-0 px-1.5"
                  >
                    <Building2 className="h-2.5 w-2.5 mr-0.5" />
                    {t('users', 'team_owner')}
                  </Badge>
                )}

                {user.membersCount !== undefined && user.membersCount > 0 && onOpenTeam && (
                  <button
                    type="button"
                    data-testid={`user-row-team-badge-${user.id}`}
                    onClick={() => onOpenTeam(user)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-2xs h-5 font-medium transition-colors cursor-pointer"
                    title={t('users', 'action_manage_team')}
                  >
                    <UsersIcon className="size-2.5" />
                    <span className="tabular-nums">{user.membersCount}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          )}
        </TableCell>
      )}

      {/* License Plan */}
      {visibleColumns?.plan !== false && (
        <TableCell>
          {user.license ? (
            <div className="flex items-center space-x-1.5">
              <Badge
                data-testid="user-row-plan"
                variant="outline"
                className={`text-2xs h-5 px-1.5 py-0 font-medium ${
                  user.license.planType === 'ENTERPRISE'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : user.license.planType === 'PRO'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <KeyRound className="h-2.5 w-2.5 mr-1" />
                {user.license.planType}
              </Badge>
            </div>
          ) : (
            <span data-testid="user-row-plan-none" className="text-xs text-muted-foreground">
              {t('users', 'no_license')}
            </span>
          )}
        </TableCell>
      )}

      {/* Status */}
      {visibleColumns?.status !== false && (
        <TableCell>
          <StatusBadge
            status={isActive ? 'ACTIVE' : 'SUSPENDED'}
            label={isActive ? t('users', 'status_active') : t('users', 'status_suspended')}
            testId="user-row-status"
            isUk={locale === 'uk'}
          />
        </TableCell>
      )}

      {/* Created Date */}
      {visibleColumns?.created !== false && (
        <TableCell className="text-xs text-muted-foreground font-mono tabular-nums">
          {new Date(user.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </TableCell>
      )}

      {/* Actions */}
      <TableCell className="text-right">
        <UserRowActions
          user={user}
          onStatusChange={onStatusChange}
          onOpenDelete={onOpenDelete}
          onOpenTeam={onOpenTeam}
        />
      </TableCell>
    </TableRow>
  );
});
