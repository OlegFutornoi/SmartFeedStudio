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
import { UserRowActions } from './UserRowActions';

interface UserTableRowProps {
  user: UserListItemDto;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (user: UserListItemDto) => void;
  onOpenTeam?: (user: UserListItemDto) => void;
}

export const UserTableRow = React.memo(function UserTableRow({
  user,
  isExpanded = false,
  onToggleExpand,
  onStatusChange,
  onOpenDelete,
  onOpenTeam,
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
        <div className="flex items-center space-x-2.5">
          {hasMembers && onToggleExpand ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid={`user-row-expand-btn-${user.id}`}
              onClick={onToggleExpand}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
              title={isExpanded ? t('users', 'collapse_team') : t('users', 'expand_team')}
            >
              {isExpanded ? (
                <ChevronDown className="size-4 text-primary" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
          ) : (
            <div className="w-7 shrink-0" />
          )}

          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
            {user.fullName
              ? user.fullName.slice(0, 2).toUpperCase()
              : user.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div
              data-testid="user-row-name"
              className="font-semibold text-foreground truncate text-sm"
            >
              {user.fullName || t('users', 'unnamed_user')}
            </div>
            <div
              data-testid="user-row-email"
              className="text-xs text-muted-foreground font-mono truncate"
            >
              {user.email}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell>
        {user.role === 'ADMIN' ? (
          <Badge
            data-testid="user-row-role-admin"
            variant="outline"
            className="bg-primary/10 text-primary border-primary/20 text-xs font-medium"
          >
            <Shield className="h-3 w-3 mr-1" />
            {t('users', 'role_admin')}
          </Badge>
        ) : (
          <Badge
            data-testid="user-row-role"
            variant="outline"
            className="bg-secondary text-secondary-foreground text-xs"
          >
            {t('users', 'role_user')}
          </Badge>
        )}
      </TableCell>

      {/* Team / Organization */}
      <TableCell>
        {user.organization ? (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
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
                  className="bg-muted text-muted-foreground border-border text-[10px] font-medium py-0 px-1.5"
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
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-medium transition-colors cursor-pointer"
                  title={t('users', 'action_manage_team')}
                >
                  <UsersIcon className="size-3" />
                  <span className="tabular-nums">{user.membersCount}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        )}
      </TableCell>

      {/* License Plan */}
      <TableCell>
        {user.license ? (
          <div className="flex items-center space-x-1.5">
            <Badge
              data-testid="user-row-plan"
              variant="outline"
              className={
                user.license.planType === 'ENTERPRISE'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : user.license.planType === 'PRO'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-secondary text-secondary-foreground'
              }
            >
              <KeyRound className="h-3 w-3 mr-1" />
              {user.license.planType}
            </Badge>
          </div>
        ) : (
          <span data-testid="user-row-plan-none" className="text-xs text-muted-foreground">
            {t('users', 'no_license')}
          </span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge
          data-testid="user-row-status"
          variant="outline"
          className={
            isActive
              ? 'bg-primary/10 text-primary border-primary/20 text-xs font-medium'
              : 'bg-destructive/10 text-destructive border-destructive/20 text-xs'
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
              isActive ? 'bg-primary animate-pulse' : 'bg-destructive'
            }`}
          />
          {isActive ? t('users', 'status_active') : t('users', 'status_suspended')}
        </Badge>
      </TableCell>

      {/* Created Date */}
      <TableCell className="text-xs text-muted-foreground font-mono tabular-nums">
        {new Date(user.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </TableCell>

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
