'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { UserListItemDto } from '@smartfeed/shared';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { UserTableRow } from './UserTableRow';
import { useLanguage } from '../../contexts/LanguageContext';

interface UsersTableProps {
  users: UserListItemDto[];
  isLoading: boolean;
}

export const UsersTable = React.memo(function UsersTable({ users, isLoading }: UsersTableProps) {
  const { t } = useLanguage();

  return (
    <Card
      data-testid="users-table-card"
      className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md overflow-hidden"
    >
      <CardContent className="p-0">
        {isLoading ? (
          <div
            data-testid="users-table-loading"
            className="py-20 text-center text-sm text-muted-foreground animate-pulse"
          >
            {t('users', 'loading_users')}
          </div>
        ) : users.length === 0 ? (
          <div data-testid="users-empty-state" className="py-20 text-center space-y-2">
            <Users className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <p className="text-sm font-medium text-foreground">{t('users', 'empty_users_title')}</p>
            <p className="text-xs text-muted-foreground">{t('users', 'empty_users_desc')}</p>
          </div>
        ) : (
          <Table data-testid="users-data-table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead data-testid="th-user" className="w-[300px]">
                  {t('users', 'col_user')}
                </TableHead>
                <TableHead data-testid="th-role">{t('users', 'col_role')}</TableHead>
                <TableHead data-testid="th-plan">{t('users', 'col_plan')}</TableHead>
                <TableHead data-testid="th-quotas">{t('users', 'col_quotas')}</TableHead>
                <TableHead data-testid="th-status">{t('users', 'col_status')}</TableHead>
                <TableHead data-testid="th-created" className="text-right">
                  {t('users', 'col_created')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <UserTableRow key={u.id} user={u} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});
