'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { UserListItemDto } from '@smartfeed/shared';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '../ui/table';
import { UserTableRow } from './UserTableRow';

interface UsersTableProps {
  users: UserListItemDto[];
  isLoading: boolean;
}

export const UsersTable = React.memo(function UsersTable({ users, isLoading }: UsersTableProps) {
  return (
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
                <UserTableRow key={u.id} user={u} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});
