'use client';

import React from 'react';
import { UserListItemDto } from '@smartfeed/shared';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRowActions } from '@/components/users/UserRowActions';
import { UserAvatarCell } from '@/components/ui/user-avatar-cell';
import { CornerDownRight, KeyRound } from 'lucide-react';

interface UserTeamSubRowsProps {
  ownerUser: UserListItemDto;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (user: UserListItemDto) => void;
  visibleColumns?: Record<string, boolean>;
}

export const UserTeamSubRows = React.memo(function UserTeamSubRows({
  ownerUser,
  onStatusChange,
  onOpenDelete,
  visibleColumns,
}: UserTeamSubRowsProps) {
  const { t, locale } = useLanguage();
  const members = ownerUser.teamMembers || [];

  if (members.length === 0) return null;

  return (
    <>
      {members.map((member) => {
        const isActive = member.isActive !== false;
        return (
          <TableRow
            key={`subrow-${member.id}`}
            data-testid={`user-table-subrow-${member.id}`}
            className="bg-muted/15 border-l-2 border-l-primary/40 hover:bg-muted/30 transition-colors"
          >
            {/* User Info (Indented with sub-tree connector) */}
            <TableCell className="pl-6 py-2">
              <div className="flex items-center space-x-2">
                <CornerDownRight className="size-3 text-primary/60 shrink-0" />
                <UserAvatarCell
                  fullName={member.fullName}
                  email={member.email}
                  avatarUrl={member.avatarUrl}
                  size="sm"
                  showEmail
                />
                <Badge
                  variant="outline"
                  className="bg-secondary/60 text-[9px] h-4 px-1 text-muted-foreground border-border/50 shrink-0"
                >
                  {t('users', 'team_member')}
                </Badge>
              </div>
            </TableCell>

            {/* System Role */}
            {visibleColumns?.role !== false && (
              <TableCell className="py-2">
                <Badge
                  variant="outline"
                  className="bg-secondary text-secondary-foreground text-2xs h-5 px-1.5 py-0 font-medium"
                >
                  {t('users', 'role_user')}
                </Badge>
              </TableCell>
            )}

            {/* Team / Organization */}
            {visibleColumns?.team !== false && (
              <TableCell className="py-2">
                <span className="text-xs text-muted-foreground truncate max-w-[150px] inline-block">
                  {ownerUser.organization?.organizationName || '—'}
                </span>
              </TableCell>
            )}

            {/* License Plan (Same as Owner) */}
            {visibleColumns?.plan !== false && (
              <TableCell className="py-2">
                {ownerUser.license ? (
                  <div className="flex items-center space-x-1.5">
                    <Badge
                      data-testid={`user-subrow-plan-${member.id}`}
                      variant="outline"
                      className={`text-2xs h-5 px-1.5 py-0 font-medium ${
                        ownerUser.license.planType === 'ENTERPRISE'
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : ownerUser.license.planType === 'PRO'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <KeyRound className="h-2.5 w-2.5 mr-1" />
                      {ownerUser.license.planType}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">{t('users', 'no_license')}</span>
                )}
              </TableCell>
            )}

            {/* Status */}
            {visibleColumns?.status !== false && (
              <TableCell className="py-2">
                <Badge
                  data-testid={`user-subrow-status-${member.id}`}
                  variant="outline"
                  className={`text-2xs h-5 px-1.5 py-0 font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                      isActive ? 'bg-primary animate-pulse' : 'bg-destructive'
                    }`}
                  />
                  {isActive ? t('users', 'status_active') : t('users', 'status_suspended')}
                </Badge>
              </TableCell>
            )}

            {/* Registration Date */}
            {visibleColumns?.created !== false && (
              <TableCell className="py-2 text-xs text-muted-foreground font-mono tabular-nums">
                {new Date(member.createdAt).toLocaleDateString(
                  locale === 'uk' ? 'uk-UA' : 'en-US',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  },
                )}
              </TableCell>
            )}

            {/* Actions */}
            <TableCell className="py-2 text-right">
              <UserRowActions
                user={member}
                onStatusChange={onStatusChange}
                onOpenDelete={onOpenDelete}
              />
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
});
