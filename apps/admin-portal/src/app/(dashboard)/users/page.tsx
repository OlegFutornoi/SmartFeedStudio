'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { api } from '../../../lib/api';
import { UserListItemDto } from '@smartfeed/shared';
import { UsersTable } from '../../../components/users/UsersTable';
import { UserRoleFilter } from '../../../components/users/UserRoleFilter';
import { useLanguage } from '../../../contexts/LanguageContext';

export default function UsersManagementPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeRequestRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    setIsRefreshing(true);
    try {
      const data = await api.getUsers({
        search: search.trim() || undefined,
        role: selectedRole === 'ALL' ? undefined : selectedRole,
      });
      // Guard against race conditions: only update state if this is still the newest request
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
  }, [search, selectedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const countSuffix =
    users.length === 1 ? t('users', 'user_count_one') : t('users', 'user_count_many');

  return (
    <div data-testid="users-page" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1
              data-testid="users-header-title"
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {t('users', 'title')}
            </h1>
            <Badge
              data-testid="users-count-badge"
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30"
            >
              {users.length} {countSuffix}
            </Badge>
          </div>
          <p data-testid="users-header-subtitle" className="text-sm text-muted-foreground mt-1">
            {t('users', 'subtitle')}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          data-testid="refresh-users-btn"
          className="h-9 w-9 p-0 border-border hover:bg-muted/80 self-start sm:self-auto rounded-lg"
          onClick={fetchUsers}
          disabled={isRefreshing}
          title={t('users', 'refresh_button')}
          aria-label={t('users', 'refresh_button')}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="users-search-input"
                placeholder={t('users', 'search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Role Filter Tabs */}
            <UserRoleFilter selectedRole={selectedRole} onSelectRole={setSelectedRole} />
          </div>
        </CardContent>
      </Card>

      {/* Users Table Subcomponent */}
      <UsersTable users={users} isLoading={isLoading} />
    </div>
  );
}
