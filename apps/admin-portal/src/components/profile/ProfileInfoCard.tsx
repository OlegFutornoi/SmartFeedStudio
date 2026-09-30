'use client';

import React, { useRef, useState, useCallback } from 'react';
import { User, Camera, Trash2, Loader2, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile } from '@smartfeed/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileInfoCardProps {
  user: UserProfile | null;
}

export const ProfileInfoCard = React.memo(function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  const { t } = useLanguage();
  const { updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg(t('settings', 'avatar_too_large'));
        return;
      }

      setErrorMsg(null);
      setIsUploading(true);

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 256;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/webp', 0.85);
              await updateAvatar(dataUrl);
            } else {
              await updateAvatar(reader.result as string);
            }
            setIsUploading(false);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.warn('[ProfileInfoCard] Failed to update avatar:', err);
        setErrorMsg(t('settings', 'err_password_failed'));
        setIsUploading(false);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [updateAvatar, t],
  );

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyId = useCallback(() => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [user?.id]);

  const handleRemoveAvatar = useCallback(async () => {
    setIsUploading(true);
    setErrorMsg(null);
    try {
      await updateAvatar(null);
    } catch (err) {
      console.warn('[ProfileInfoCard] Failed to remove avatar:', err);
      setErrorMsg(t('settings', 'err_password_failed'));
    } finally {
      setIsUploading(false);
    }
  }, [updateAvatar, t]);

  const isUk = t('common', 'save') === 'Зберегти';

  return (
    <Card
      data-testid="profile-info-card"
      className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <CardTitle className="text-base font-semibold">
            {t('settings', 'profile_card_title')}
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {t('settings', 'profile_card_desc')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Modern Avatar & Identity Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-muted/20">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar className="size-14 border-2 border-border shadow-xs shrink-0">
              <AvatarImage
                src={user?.avatarUrl || undefined}
                alt={user?.fullName || 'Admin'}
                data-testid="profile-avatar-img"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                {getInitials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  data-testid="profile-name"
                  className="text-sm font-semibold text-foreground truncate"
                >
                  {user?.fullName || 'Super Administrator'}
                </span>
                <Badge
                  data-testid="profile-role"
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium py-0 px-2 h-5"
                >
                  {user?.role === 'SUPER_ADMIN'
                    ? t('users', 'role_super_admin')
                    : user?.role === 'ADMIN'
                      ? t('users', 'role_admin')
                      : t('users', 'role_user')}
                </Badge>
              </div>
              <p
                data-testid="profile-email"
                className="font-mono text-xs text-muted-foreground truncate"
              >
                {user?.email || 'admin@smartfeed.studio'}
              </p>
            </div>
          </div>

          {/* Avatar Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
              data-testid="avatar-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              data-testid="change-avatar-btn"
              className="h-8 text-xs gap-1.5"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5 text-muted-foreground" />
              )}
              <span>{t('settings', 'change_avatar')}</span>
            </Button>

            {user?.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading}
                onClick={handleRemoveAvatar}
                data-testid="remove-avatar-btn"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title={t('settings', 'remove_avatar')}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {errorMsg && <p className="text-xs text-destructive font-medium">{errorMsg}</p>}

        {/* Clean Shadcn Form Fields */}
        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-fullname" className="text-xs font-medium text-foreground">
              {t('settings', 'full_name')}
            </Label>
            <Input
              id="profile-fullname"
              value={user?.fullName || 'Super Administrator'}
              readOnly
              className="h-9 text-xs bg-muted/20 border-border"
            />
            <p className="text-[11px] text-muted-foreground">{t('settings', 'avatar_hint')}</p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-email-input" className="text-xs font-medium text-foreground">
              {t('settings', 'email')}
            </Label>
            <Input
              id="profile-email-input"
              value={user?.email || 'admin@smartfeed.studio'}
              disabled
              readOnly
              className="h-9 text-xs font-mono bg-muted/40 border-border cursor-not-allowed text-muted-foreground"
            />
            <p className="text-[11px] text-muted-foreground">
              {isUk
                ? 'Основна електронна адреса для входу в панель керування.'
                : 'Primary email address for logging into the control panel.'}
            </p>
          </div>

          {/* User ID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {t('settings', 'user_id')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={user?.id || '—'}
                readOnly
                className="h-9 text-xs font-mono bg-muted/20 border-border select-all"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyId}
                className="h-9 px-3 shrink-0 text-xs gap-1.5"
              >
                {isCopied ? (
                  <>
                    <Check className="size-3.5 text-primary" />
                    <span className="text-primary font-medium">
                      {isUk ? 'Скопійовано' : 'Copied'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-muted-foreground" />
                    <span>{isUk ? 'Копіювати' : 'Copy'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
