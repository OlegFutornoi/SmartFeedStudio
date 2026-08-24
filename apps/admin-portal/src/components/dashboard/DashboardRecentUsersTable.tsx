'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { UserListItemDto } from '@smartfeed/shared';

interface DashboardRecentUsersTableProps {
  users: UserListItemDto[];
  totalUsers: number;
  isLoading: boolean;
}

export const DashboardRecentUsersTable = React.memo(function DashboardRecentUsersTable({
  users,
  totalUsers,
  isLoading,
}: DashboardRecentUsersTableProps) {
  return (
    <Card className="md:col-span-5 border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Останні зареєстровані користувачі</CardTitle>
          <CardDescription>Список облікових записів у базі даних SmartFeed Studio</CardDescription>
        </div>
        <Link href="/users">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-primary hover:text-primary"
          >
            <span>Всі користувачі ({totalUsers})</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
            Завантаження списку користувачів...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Користувачів поки що немає.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Користувач</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Ліцензія</TableHead>
                <TableHead className="text-right">Дата реєстрації</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{u.fullName || 'Без імені'}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                  </TableCell>
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
                  <TableCell>
                    {u.license ? (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      >
                        {u.license.planType}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('uk-UA', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});
