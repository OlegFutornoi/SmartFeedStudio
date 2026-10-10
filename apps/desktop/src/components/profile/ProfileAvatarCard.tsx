import { useRef, useState, type ChangeEvent } from 'react';
import { Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { optimizeAvatarImage } from '@/services/localUserProfile';

export const ProfileAvatarCard = () => {
  const { user, updateAvatar } = useAuth();
  const { t } = useTranslation(['settings', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getInitials = (name?: string | null) => {
    if (!name) return 'US';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Будь ласка, оберіть файл зображення');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      const dataUrl = await optimizeAvatarImage(file);
      await updateAvatar(dataUrl);
    } catch (err: unknown) {
      console.warn('[ProfileAvatarCard] Avatar upload error:', err);
      setErrorMsg('Не вдалося оновити аватар');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      setErrorMsg(null);
      await updateAvatar(null);
    } catch (err: unknown) {
      console.warn('[ProfileAvatarCard] Avatar removal error:', err);
      setErrorMsg('Не вдалося видалити аватар');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">{t('settings:avatar')}</CardTitle>
        </div>
        <CardDescription className="text-xs">{t('settings:avatarHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2 border-primary/20 shadow-xs">
              <AvatarImage src={user?.avatarUrl || undefined} alt={user?.fullName || 'User'} />
              <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-foreground">
                {user?.fullName || 'Client User'}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">{user?.email}</span>
              {errorMsg && (
                <span className="text-[11px] text-destructive font-medium mt-0.5">{errorMsg}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              data-testid="avatar-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="upload-avatar-button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs gap-1.5"
            >
              {isUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              <span>{t('settings:changeAvatar')}</span>
            </Button>

            {user?.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="remove-avatar-button"
                disabled={isUploading}
                onClick={handleRemoveAvatar}
                className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Trash2 className="size-3.5" />
                <span>{t('settings:removeAvatar')}</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
