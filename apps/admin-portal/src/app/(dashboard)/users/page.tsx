'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, RefreshCw, KeyRound, Filter } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { api } from '../../../lib/api';
import { UserListItemDto } from '@smartfeed/shared';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getUsers({
        search: search.trim() || undefined,
        role: selectedRole === 'ALL' ? undefined : selectedRole,
      });
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, selectedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Користувачі
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {users.length} {users.length === 1 ? 'користувач' : 'користувачів'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Керування обліковими записами, ролями та підписками платформи
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-border hover:bg-muted/80 self-start sm:self-auto"
          onClick={fetchUsers}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Оновити</span>
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
                placeholder="Пошук за email або ім'ям..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-muted-foreground mr-1 flex items-center">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Роль:
              </span>
              {(['ALL', 'SUPER_ADMIN', 'ADMIN', 'USER'] as const).map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 text-xs px-2.5 ${
                    selectedRole === role
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  {role === 'ALL' ? 'Всі' : role}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
              Завантаження списку користувачів...
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Users className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-medium text-foreground">Користувачів не знайдено</p>
              <p className="text-xs text-muted-foreground">
                Спробуйте змінити пошуковий запит або скинути фільтри.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[300px]">Користувач</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Ліцензійний план</TableHead>
                  <TableHead>Квоти & Ліміти</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Дата реєстрації</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                    {/* User Info */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                          {u.fullName
                            ? u.fullName.slice(0, 2).toUpperCase()
                            : u.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate text-sm">
                            {u.fullName || 'Без імені'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : u.role === 'ADMIN'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-secondary text-secondary-foreground'
                        }
                      >
                        {u.role}
                      </Badge>
                    </TableCell>

                    {/* License Plan */}
                    <TableCell>
                      {u.license ? (
                        <div className="flex items-center space-x-1.5">
                          <Badge
                            variant="outline"
                            className={
                              u.license.planType === 'ENTERPRISE'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : u.license.planType === 'PRO'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-secondary text-secondary-foreground'
                            }
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            {u.license.planType}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Немає ліцензії</span>
                      )}
                    </TableCell>

                    {/* Quotas & Limits */}
                    <TableCell>
                      {u.license ? (
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>
                            XML:{' '}
                            <span className="font-medium text-foreground">
                              {u.license.maxXmlLimit.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            AI:{' '}
                            <span className="font-medium text-foreground">
                              {u.license.aiCredits.toLocaleString()} кр.
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
                      {new Date(u.createdAt).toLocaleString('uk-UA', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
