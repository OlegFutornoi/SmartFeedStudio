'use client';

import React from 'react';
import { KeyRound } from 'lucide-react';
import { UserListItemDto } from '@smartfeed/shared';
import { TableRow, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';

interface UserTableRowProps {
  user: UserListItemDto;
}

export const UserTableRow = React.memo(function UserTableRow({ user }: UserTableRowProps) {
  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      {/* User Info */}
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
            {user.fullName
              ? user.fullName.slice(0, 2).toUpperCase()
              : user.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground truncate text-sm">
              {user.fullName || 'Без імені'}
            </div>
            <div className="text-xs text-muted-foreground font-mono truncate">{user.email}</div>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell>
        <Badge
          variant="outline"
          className={
            user.role === 'SUPER_ADMIN'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : user.role === 'ADMIN'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'bg-secondary text-secondary-foreground'
          }
        >
          {user.role}
        </Badge>
      </TableCell>

      {/* License Plan */}
      <TableCell>
        {user.license ? (
          <div className="flex items-center space-x-1.5">
            <Badge
              variant="outline"
              className={
                user.license.planType === 'ENTERPRISE'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : user.license.planType === 'PRO'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-secondary text-secondary-foreground'
              }
            >
              <KeyRound className="h-3 w-3 mr-1" />
              {user.license.planType}
            </Badge>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Немає ліцензії</span>
        )}
      </TableCell>

      {/* Quotas & Limits */}
      <TableCell>
        {user.license ? (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>
              XML:{' '}
              <span className="font-medium text-foreground">
                {user.license.maxXmlLimit.toLocaleString()}
              </span>
            </div>
            <div>
              AI:{' '}
              <span className="font-medium text-foreground">
                {user.license.aiCredits.toLocaleString()} кр.
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Активний</span>
        </div>
      </TableCell>

      {/* Created Date */}
      <TableCell className="text-right text-xs text-muted-foreground font-mono">
        {new Date(user.createdAt).toLocaleString('uk-UA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </TableCell>
    </TableRow>
  );
});
