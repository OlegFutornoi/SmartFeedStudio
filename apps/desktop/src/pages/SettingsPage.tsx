import { useState, useRef } from 'react';
import { Settings, User, Shield, Sliders, HardDrive, Upload, Trash2, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { SettingsStorageTab } from '@/components/settings/SettingsStorageTab';
import { optimizeAvatarImage } from '@/services/localUserProfile';

export function SettingsPage() {
  const { user, updateAvatar } = useAuth();
  const { t } = useTranslation(['settings', 'common']);
  const [activeTab, setActiveTab] = useState<'general' | 'storage'>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      console.warn('[SettingsPage] Avatar upload error:', err);
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
      console.warn('[SettingsPage] Avatar removal error:', err);
      setErrorMsg('Не вдалося видалити аватар');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      data-testid="settings-page"
      className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground border border-border">
            <Settings className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('settings:title')}
            </h1>
            <p className="text-xs text-muted-foreground">{t('settings:description')}</p>
          </div>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center p-1 bg-secondary/50 rounded-xl border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            data-testid="general-tab-btn"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'general'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="size-3.5" />
            <span>{t('settings:generalTab')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            data-testid="storage-tab-btn"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'storage'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <HardDrive className="size-3.5" />
            <span>{t('settings:databaseTab')}</span>
          </button>
        </div>
      </div>

      {activeTab === 'storage' ? (
        <SettingsStorageTab />
      ) : (
        <>
          {/* 1. Account Profile Card */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <User className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{t('settings:profile')}</CardTitle>
              </div>
              <CardDescription className="text-xs">{t('settings:profileDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Avatar management */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/15">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 border-2 border-primary/20 shadow-xs">
                    <AvatarImage
                      src={user?.avatarUrl || undefined}
                      alt={user?.fullName || 'User'}
                    />
                    <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
                      {user?.fullName
                        ? user.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {t('settings:avatar')}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {t('settings:avatarHint')}
                    </span>
                    {errorMsg && (
                      <span className="text-[11px] text-destructive font-medium mt-0.5">
                        {errorMsg}
                      </span>
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

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t('settings:fullName')}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {user?.fullName || 'Client User'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t('settings:email')}
                  </span>
                  <span className="text-xs font-semibold text-foreground font-mono">
                    {user?.email}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t('settings:role')}
                  </span>
                  <div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {t('settings:keySecurity')}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <Shield className="size-3.5 text-muted-foreground" />
                    <span>{t('settings:keySecurityDesc')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Appearance & Interface Preferences Card */}
          <Card className="border-border bg-card shadow-sm overflow-visible">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <Sliders className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{t('settings:appearance')}</CardTitle>
              </div>
              <CardDescription className="text-xs">{t('settings:appearanceDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
