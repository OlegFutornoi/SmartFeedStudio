'use client';

import React from 'react';
import { UserListItemDto } from '@smartfeed/shared';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRowActions } from './UserRowActions';
import { CornerDownRight, KeyRound } from 'lucide-react';

interface UserTeamSubRowsProps {
  ownerUser: UserListItemDto;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (user: UserListItemDto) => void;
}

export const UserTeamSubRows = React.memo(function UserTeamSubRows({
  ownerUser,
  onStatusChange,
  onOpenDelete,
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
            <TableCell className="pl-8 py-2.5">
              <div className="flex items-center space-x-2.5">
                <CornerDownRight className="size-3.5 text-primary/60 shrink-0" />
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-semibold text-[10px] uppercase shrink-0">
                  {member.fullName ? member.fullName.substring(0, 2) : member.email.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs text-foreground truncate">
                      {member.fullName || t('users', 'unnamed_user')}
                    </span>
                    <Badge
                      variant="outline"
                      className="bg-secondary/60 text-[10px] h-4 px-1 text-muted-foreground border-border/50"
                    >
                      {t('users', 'team_member')}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate font-mono">
                    {member.email}
                  </div>
                </div>
              </div>
            </TableCell>

            {/* System Role */}
            <TableCell className="py-2.5">
              <Badge variant="outline" className="bg-secondary text-secondary-foreground text-xs">
                {t('users', 'role_user')}
              </Badge>
            </TableCell>

            {/* Team / Organization */}
            <TableCell className="py-2.5">
              <span className="text-xs text-muted-foreground truncate max-w-[150px] inline-block">
                {ownerUser.organization?.organizationName || '—'}
              </span>
            </TableCell>

            {/* License Plan (Same as Owner) */}
            <TableCell className="py-2.5">
              {ownerUser.license ? (
                <div className="flex items-center space-x-1.5">
                  <Badge
                    data-testid={`user-subrow-plan-${member.id}`}
                    variant="outline"
                    className={
                      ownerUser.license.planType === 'ENTERPRISE'
                        ? 'bg-primary/15 text-primary border-primary/30 text-xs font-semibold'
                        : ownerUser.license.planType === 'PRO'
                          ? 'bg-muted text-foreground border-border text-xs font-semibold'
                          : ownerUser.license.planType === 'GROWTH'
                            ? 'bg-secondary text-secondary-foreground border-border text-xs font-semibold'
                            : 'bg-muted/50 text-muted-foreground border-border text-xs font-medium'
                    }
                  >
                    <KeyRound className="h-3 w-3 mr-1" />
                    {ownerUser.license.planType}
                  </Badge>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">{t('users', 'no_license')}</span>
              )}
            </TableCell>

            {/* Status */}
            <TableCell className="py-2.5">
              <Badge
                data-testid={`user-subrow-status-${member.id}`}
                variant="outline"
                className={
                  isActive
                    ? 'border-border text-foreground font-normal text-xs'
                    : 'bg-destructive/10 text-destructive border-destructive/20 text-xs'
                }
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                    isActive ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'
                  }`}
                />
                {isActive ? t('users', 'status_active') : t('users', 'status_suspended')}
              </Badge>
            </TableCell>

            {/* Registration Date */}
            <TableCell className="py-2.5 text-xs text-muted-foreground">
              {new Date(member.createdAt).toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </TableCell>

            {/* Actions */}
            <TableCell className="py-2.5 text-right">
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
