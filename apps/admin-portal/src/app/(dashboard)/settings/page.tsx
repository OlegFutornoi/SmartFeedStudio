'use client';

import React, { useState } from 'react';
import {
  Shield,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Server,
  Lock,
  Database,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../contexts/AuthContext';
import { ThemeCustomizer } from '../../../components/theme/theme-customizer';

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('Новий пароль повинен містити не менше 8 символів');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Новий пароль та підтвердження не співпадають');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Не вдалося змінити пароль. Перевірте поточний пароль.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Налаштування акаунту та безпеки
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Керуйте даними профілю адміністратора, паролем, кольоровою темою та параметрами системи
        </p>
      </div>

      {/* 1. Theme and Appearance Customizer */}
      <ThemeCustomizer />

      {/* 2. Admin Profile & Infrastructure */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Профіль адміністратора</CardTitle>
                <CardDescription>Основні дані вашого облікового запису</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Повне ім'я</Label>
              <div className="font-semibold text-foreground text-sm">
                {user?.fullName || 'Super Administrator'}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="font-mono text-foreground text-sm">
                {user?.email || 'admin@gmail.com'}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Системна роль</Label>
              <div>
                <Badge
                  variant="outline"
                  className="bg-purple-500/10 text-purple-400 border-purple-500/30"
                >
                  {user?.role || 'SUPER_ADMIN'}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ID користувача</Label>
              <div className="font-mono text-xs text-muted-foreground break-all">
                {user?.id || '—'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Infrastructure Card */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Інфраструктура</CardTitle>
                <CardDescription>Статус з'єднань платформи SmartFeed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center space-x-2.5 text-sm">
                <Database className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">PostgreSQL 16</span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
              >
                Підключено
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center space-x-2.5 text-sm">
                <Server className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">Redis 7 (BullMQ)</span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
              >
                Підключено
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center space-x-2.5 text-sm">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">S3 / MinIO Cloud Storage</span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
              >
                Підключено
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Change Password Card */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Зміна паролю облікового запису</CardTitle>
              <CardDescription>
                Оновіть ваш пароль для збереження безпеки панелі адміністрування
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive border border-destructive/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center space-x-2 rounded-lg bg-emerald-500/15 p-3 text-sm text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Пароль успішно оновлено!</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="current-pwd">Поточний пароль</Label>
              <Input
                id="current-pwd"
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">Новий пароль (мін. 8 символів)</Label>
              <Input
                id="new-pwd"
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-pwd">Підтвердження нового паролю</Label>
              <Input
                id="confirm-pwd"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Збереження...
                </>
              ) : (
                'Зберегти новий пароль'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
