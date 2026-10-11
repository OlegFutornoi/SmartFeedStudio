'use client';

import React, { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { UserListItemDto } from '@smartfeed/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserTableRow } from '@/components/users/UserTableRow';
import { UserTeamSubRows } from '@/components/users/UserTeamSubRows';
import { UsersTableToolbar } from '@/components/users/UsersTableToolbar';
import { TablePagination } from '@/components/ui/table-pagination';
import { usePagination } from '@/hooks/usePagination';
import { useLanguage } from '@/contexts/LanguageContext';
import { useColumnVisibility, ColumnConfig } from '@/hooks/useColumnVisibility';

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

type UserColumnId = 'user' | 'role' | 'team' | 'plan' | 'status' | 'created' | 'actions';

const USER_COLUMNS: ColumnConfig<UserColumnId>[] = [
  { id: 'user', labelUk: 'Користувач', labelEn: 'User', canHide: false, defaultVisible: true },
  { id: 'role', labelUk: 'Роль', labelEn: 'Role', canHide: true, defaultVisible: true },
  {
    id: 'team',
    labelUk: 'Організація / Команда',
    labelEn: 'Organization / Team',
    canHide: true,
    defaultVisible: true,
  },
  {
    id: 'plan',
    labelUk: 'Тарифний план',
    labelEn: 'Plan Tier',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'status', labelUk: 'Статус', labelEn: 'Status', canHide: true, defaultVisible: true },
  {
    id: 'created',
    labelUk: 'Дата реєстрації',
    labelEn: 'Registered Date',
    canHide: true,
    defaultVisible: true,
  },
  { id: 'actions', labelUk: 'Дії', labelEn: 'Actions', canHide: false, defaultVisible: true },
];

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

  const { visibleColumns, toggleColumn, resetToDefaults, columnOptions } =
    useColumnVisibility<UserColumnId>('admin_users_columns', USER_COLUMNS, isUk);

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
    const ids = new Set<string>();
    users.forEach((u) => {
      ids.add(u.id);
      u.teamMembers?.forEach((m) => ids.add(m.id));
    });
    return ids.size;
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
        columnOptions={columnOptions}
        onToggleColumn={toggleColumn}
        onResetColumns={resetToDefaults}
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
                {visibleColumns.role !== false && (
                  <TableHead data-testid="th-role">{t('users', 'col_role')}</TableHead>
                )}
                {visibleColumns.team !== false && (
                  <TableHead data-testid="th-team">{t('users', 'col_team')}</TableHead>
                )}
                {visibleColumns.plan !== false && (
                  <TableHead data-testid="th-plan">{t('users', 'col_plan')}</TableHead>
                )}
                {visibleColumns.status !== false && (
                  <TableHead data-testid="th-status">{t('users', 'col_status')}</TableHead>
                )}
                {visibleColumns.created !== false && (
                  <TableHead data-testid="th-created">{t('users', 'col_created')}</TableHead>
                )}
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
                      visibleColumns={visibleColumns}
                    />
                    {isExpanded && (
                      <UserTeamSubRows
                        ownerUser={u}
                        onStatusChange={onStatusChange}
                        onOpenDelete={onOpenDelete}
                        visibleColumns={visibleColumns}
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
