'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { api } from '@/lib/api';
import { UserListItemDto } from '@smartfeed/shared';
import { UsersTable } from '@/components/users/UsersTable';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { UserDeleteDialog } from '@/components/users/UserDeleteDialog';
import { TeamMembersDialog } from '@/components/users/TeamMembersDialog';
import { useLanguage } from '@/contexts/LanguageContext';

export default function UsersManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedOrgRole, setSelectedOrgRole] = useState<'ALL' | 'OWNERS' | 'MEMBERS'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItemDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [teamDialogTarget, setTeamDialogTarget] = useState<UserListItemDto | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const activeRequestRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    setIsRefreshing(true);
    try {
      const data = await api.getUsers({
        search: search.trim() || undefined,
        role: selectedRole === 'ALL' ? undefined : selectedRole,
        orgRoleFilter: selectedOrgRole === 'ALL' ? undefined : selectedOrgRole,
        limit: 50,
      });
      if (requestId === activeRequestRef.current) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [search, selectedRole, selectedOrgRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const isFiltered = useMemo(() => {
    return search.trim().length > 0 || selectedRole !== 'ALL' || selectedOrgRole !== 'ALL';
  }, [search, selectedRole, selectedOrgRole]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedRole('ALL');
    setSelectedOrgRole('ALL');
  }, []);

  const handleUserCreated = useCallback(
    (newUser: UserListItemDto) => {
      // Optimistically prepend new user and refresh in background
      setUsers((prev) => [newUser, ...prev]);
      setSuccessMessage(t('users', 'create_success'));
      setTimeout(() => setSuccessMessage(null), 3000);
      setTimeout(() => fetchUsers(), 500);
    },
    [t, fetchUsers],
  );

  const handleStatusChange = useCallback(async (userId: string, newActive: boolean) => {
    try {
      await api.updateUserStatus(userId, newActive);
      // Optimistically update main user list and any nested team members
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            return { ...u, isActive: newActive };
          }
          if (u.teamMembers && u.teamMembers.length > 0) {
            const updatedMembers = u.teamMembers.map((m) =>
              m.id === userId ? { ...m, isActive: newActive } : m,
            );
            return { ...u, teamMembers: updatedMembers };
          }
          return u;
        }),
      );
      // Also update team dialog target if open
      setTeamDialogTarget((prev) => {
        if (!prev) return null;
        if (prev.id === userId) {
          return { ...prev, isActive: newActive };
        }
        if (prev.teamMembers) {
          const updatedMembers = prev.teamMembers.map((m) =>
            m.id === userId ? { ...m, isActive: newActive } : m,
          );
          return { ...prev, teamMembers: updatedMembers };
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  }, []);

  const handleDeleteUser = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      setUsers((prev) =>
        prev
          .filter((u) => u.id !== deleteTarget.id)
          .map((u) => {
            if (u.teamMembers) {
              const remaining = u.teamMembers.filter((m) => m.id !== deleteTarget.id);
              return {
                ...u,
                teamMembers: remaining,
                membersCount: remaining.length,
              };
            }
            return u;
          }),
      );
      setTeamDialogTarget((prev) => {
        if (!prev) return null;
        if (prev.id === deleteTarget.id) return null;
        if (prev.teamMembers) {
          const remaining = prev.teamMembers.filter((m) => m.id !== deleteTarget.id);
          return {
            ...prev,
            teamMembers: remaining,
            membersCount: remaining.length,
          };
        }
        return prev;
      });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  return (
    <div
      data-testid="users-page"
      className="flex flex-col space-y-4 animate-in fade-in duration-300 flex-1 min-h-[calc(100vh-8rem)]"
    >
      {/* Success toast */}
      {successMessage && (
        <div
          data-testid="create-user-success-toast"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground border border-primary/20 text-xs font-medium shadow-lg animate-in slide-in-from-bottom-2 duration-300"
        >
          {successMessage}
        </div>
      )}

      {/* Unified Table Container with Integrated Toolbar */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        selectedRole={selectedRole}
        onSelectRole={setSelectedRole}
        selectedOrgRole={selectedOrgRole}
        onSelectOrgRole={setSelectedOrgRole}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
        isRefreshing={isRefreshing}
        onRefresh={fetchUsers}
        onOpenCreateUser={() => setCreateDialogOpen(true)}
        onStatusChange={handleStatusChange}
        onOpenDelete={(u) => setDeleteTarget(u)}
        onOpenTeam={(u) => setTeamDialogTarget(u)}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleUserCreated}
      />

      {/* User Delete Confirmation Dialog */}
      <UserDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        user={deleteTarget}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
      />

      {/* Team Members Management Dialog */}
      <TeamMembersDialog
        open={Boolean(teamDialogTarget)}
        onOpenChange={(open) => !open && setTeamDialogTarget(null)}
        ownerUser={teamDialogTarget}
        onStatusChange={handleStatusChange}
        onOpenDelete={(u) => setDeleteTarget(u)}
      />
    </div>
  );
}
