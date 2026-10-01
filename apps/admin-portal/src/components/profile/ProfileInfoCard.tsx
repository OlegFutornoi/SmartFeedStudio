'use client';

import React, { useRef, useState, useCallback } from 'react';
import { User, Camera, Trash2, Loader2, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

      <CardContent className="space-y-4">
        {/* Modern Executive Identity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-4 rounded-xl border border-border/70 bg-muted/20">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="size-16 border-2 border-border shadow-xs shrink-0">
              <AvatarImage
                src={user?.avatarUrl || undefined}
                alt={user?.fullName || 'Admin'}
                data-testid="profile-avatar-img"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {getInitials(user?.fullName, user?.email)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  data-testid="profile-name"
                  className="text-base font-semibold text-foreground truncate"
                >
                  {user?.fullName || 'Super Administrator'}
                </span>
                <Badge
                  data-testid="profile-role"
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs font-medium py-0.5 px-2.5"
                >
                  {user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
                    ? t('users', 'role_admin')
                    : t('users', 'role_user')}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  <span data-testid="profile-email" className="font-mono">
                    {user?.email || 'admin@smartfeed.studio'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar Actions & Format Hint */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
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
            <span className="text-[11px] text-muted-foreground">
              {t('settings', 'avatar_hint')}
            </span>
          </div>
        </div>

        {errorMsg && <p className="text-xs text-destructive font-medium">{errorMsg}</p>}
      </CardContent>
    </Card>
  );
});
