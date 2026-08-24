'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  KeyRound,
  Database,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
  Key,
  ExternalLink,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { api } from '../../lib/api';
import { UserListItemDto, UsersStatsDto } from '@smartfeed/shared';
import { useAuth } from '../../contexts/AuthContext';
import { ChangePasswordDialog } from '../../components/profile/change-password-dialog';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsersStatsDto>({
    totalUsers: 0,
    activeLicenses: 0,
    superAdminsCount: 0,
    standardUsersCount: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, usersData] = await Promise.all([
          api.getUsersStats(),
          api.getUsers({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentUsers(usersData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Вітаємо, {user?.fullName || 'Адміністратор'}!
            </h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {user?.role || 'SUPER_ADMIN'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Огляд активності користувачів, ліцензій та хмарного сховища SmartFeed Studio
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/users">
            <Button className="h-9 gap-1.5 shadow-md shadow-primary/20">
              <Users className="h-4 w-4" />
              <span>Список користувачів</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-9 gap-1.5 border-border hover:bg-muted/80"
            onClick={() => setPasswordDialogOpen(true)}
          >
            <Key className="h-4 w-4 text-primary" />
            <span>Змінити пароль</span>
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid (dashboard-01 style) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Main Focus Metric: Total Users */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition-all shadow-md">
          <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всього користувачів
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {isLoading ? '...' : stats.totalUsers}
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground mt-2">
              <span className="text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                {stats.standardUsersCount} клієнтів
              </span>
              <span>&bull;</span>
              <span>{stats.superAdminsCount} адмінів</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Licenses */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm group hover:border-emerald-500/50 transition-all shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активні ліцензії
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <KeyRound className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {isLoading ? '...' : stats.activeLicenses}
            </div>
            <p className="text-xs text-muted-foreground mt-2">План Free, Pro та Enterprise</p>
          </CardContent>
        </Card>

        {/* Cloud Object Storage */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm group hover:border-blue-500/50 transition-all shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              S3 / MinIO Сховище
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Database className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">Активно</div>
            <p className="text-xs text-muted-foreground mt-2">
              Bucket: <span className="font-mono text-foreground">smartfeed-storage</span>
            </p>
          </CardContent>
        </Card>

        {/* Database & Infrastructure */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm group hover:border-purple-500/50 transition-all shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              База даних PostgreSQL
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              16.0 Online
            </div>
            <p className="text-xs text-muted-foreground mt-2">Prisma ORM v6 &bull; CQRS Engine</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Recent Users Preview Table (dashboard-01 style) */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-5 border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Останні зареєстровані користувачі
              </CardTitle>
              <CardDescription>
                Список облікових записів у базі даних SmartFeed Studio
              </CardDescription>
            </div>
            <Link href="/users">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1 text-primary hover:text-primary"
              >
                <span>Всі користувачі ({stats.totalUsers})</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
                Завантаження списку користувачів...
              </div>
            ) : recentUsers.length === 0 ? (
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
                  {recentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {u.fullName || 'Без імені'}
                        </div>
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

        {/* Quick Actions & Security Sidebar Panel */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Швидкі дії</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link href="/users" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
                >
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  <span>Переглянути всіх ({stats.totalUsers})</span>
                </Button>
              </Link>
              <Link href="/licenses" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
                >
                  <KeyRound className="h-4 w-4 mr-2 text-emerald-400" />
                  <span>Керування ліцензіями</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start text-xs h-9 border-border hover:bg-muted/80"
                onClick={() => setPasswordDialogOpen(true)}
              >
                <Key className="h-4 w-4 mr-2 text-amber-400" />
                <span>Змінити мій пароль</span>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Безпека адмін-панелі</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Використовується JWT з ротацією токенів та bcrypt хешування паролів.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </div>
  );
}
