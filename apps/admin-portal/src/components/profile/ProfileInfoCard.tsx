'use client';

import React, { useRef, useState, useCallback } from 'react';
import { User, Upload, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings', 'profile_card_title')}</CardTitle>
            <CardDescription>{t('settings', 'profile_card_desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Section */}
        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-border shadow-xs shrink-0">
            <AvatarImage
              src={user?.avatarUrl || undefined}
              alt={user?.fullName || 'Admin'}
              data-testid="profile-avatar-img"
            />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-base">
              {getInitials(user?.fullName, user?.email)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
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
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t('settings', 'remove_avatar')}</span>
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{t('settings', 'avatar_hint')}</p>
            {errorMsg && <p className="text-xs text-destructive font-medium">{errorMsg}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'full_name')}</Label>
          <div data-testid="profile-name" className="font-semibold text-foreground text-sm">
            {user?.fullName || 'Super Administrator'}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'email')}</Label>
          <div data-testid="profile-email" className="font-mono text-foreground text-sm">
            {user?.email || 'admin@gmail.com'}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'role')}</Label>
          <div>
            <Badge
              data-testid="profile-role"
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30"
            >
              {user?.role === 'SUPER_ADMIN'
                ? t('users', 'role_super_admin')
                : user?.role === 'ADMIN'
                  ? t('users', 'role_admin')
                  : t('users', 'role_user')}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{t('settings', 'user_id')}</Label>
          <div className="font-mono text-xs text-muted-foreground break-all">{user?.id || '—'}</div>
        </div>
      </CardContent>
    </Card>
  );
});
