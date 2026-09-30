'use client';

import React, { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { UserListItemDto } from '@smartfeed/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserTableRow } from './UserTableRow';
import { UserTeamSubRows } from './UserTeamSubRows';
import { UsersTableToolbar } from './UsersTableToolbar';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useLanguage } from '@/contexts/LanguageContext';

interface UsersTableProps {
  users: UserListItemDto[];
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  selectedOrgRole: 'ALL' | 'OWNERS' | 'MEMBERS';
  onSelectOrgRole: (role: 'ALL' | 'OWNERS' | 'MEMBERS') => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCreateUser: () => void;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (user: UserListItemDto) => void;
  onOpenTeam: (user: UserListItemDto) => void;
}

export const UsersTable = React.memo(function UsersTable({
  users,
  isLoading,
  search,
  onSearchChange,
  selectedRole,
  onSelectRole,
  selectedOrgRole,
  onSelectOrgRole,
  onResetFilters,
  isFiltered,
  isRefreshing,
  onRefresh,
  onOpenCreateUser,
  onStatusChange,
  onOpenDelete,
  onOpenTeam,
}: UsersTableProps) {
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());

  const { currentPage, pageSize, totalPages, totalItems, paginatedItems, setPage, setPageSize } =
    usePagination(users, {
      initialPageSize: 10,
      resetDeps: [users],
    });

  // Reset expanded accordion rows whenever search or filters change
  React.useEffect(() => {
    setExpandedUserIds(new Set());
  }, [search, selectedRole, selectedOrgRole, currentPage]);

  const totalUsersCount = React.useMemo(() => {
    return users.reduce((acc, u) => acc + 1 + (u.teamMembers ? u.teamMembers.length : 0), 0);
  }, [users]);

  const toggleExpand = useCallback((userId: string) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  return (
    <Card
      data-testid="users-table-card"
      className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm flex-1 flex flex-col min-h-[540px] rounded-lg overflow-hidden"
    >
      {/* Integrated Minimalist Toolbar */}
      <UsersTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        selectedRole={selectedRole}
        onSelectRole={onSelectRole}
        selectedOrgRole={selectedOrgRole}
        onSelectOrgRole={onSelectOrgRole}
        onResetFilters={onResetFilters}
        isFiltered={isFiltered}
        totalCount={totalUsersCount}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onOpenCreateUser={onOpenCreateUser}
      />

      <CardContent className="p-0 flex-1 flex flex-col">
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
                <TableHead data-testid="th-user" className="w-[280px]">
                  {t('users', 'col_user')}
                </TableHead>
                <TableHead data-testid="th-role">{t('users', 'col_role')}</TableHead>
                <TableHead data-testid="th-team">{t('users', 'col_team')}</TableHead>
                <TableHead data-testid="th-plan">{t('users', 'col_plan')}</TableHead>
                <TableHead data-testid="th-status">{t('users', 'col_status')}</TableHead>
                <TableHead data-testid="th-created">{t('users', 'col_created')}</TableHead>
                <TableHead data-testid="th-actions" className="text-right w-[60px]">
                  {t('users', 'col_actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((u) => {
                const isExpanded = expandedUserIds.has(u.id);
                return (
                  <React.Fragment key={u.id}>
                    <UserTableRow
                      user={u}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpand(u.id)}
                      onStatusChange={onStatusChange}
                      onOpenDelete={onOpenDelete}
                      onOpenTeam={onOpenTeam}
                    />
                    {isExpanded && (
                      <UserTeamSubRows
                        ownerUser={u}
                        onStatusChange={onStatusChange}
                        onOpenDelete={onOpenDelete}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Pagination Footer */}
      {!isLoading && users.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          isUk={isUk}
          testIdPrefix="users-pagination"
        />
      )}
    </Card>
  );
});
