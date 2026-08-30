import { useState } from 'react';
import { Settings, User, Shield, Sliders, HardDrive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { SettingsStorageTab } from '@/components/settings/SettingsStorageTab';

export function SettingsPage() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const isUk = language === 'uk';
  const [activeTab, setActiveTab] = useState<'general' | 'storage'>('general');

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
              {isUk ? 'Налаштування' : 'Settings'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isUk
                ? 'Персоналізація інтерфейсу, локальна база даних та параметри сеансу'
                : 'Manage interface appearance, local database storage, and session security'}
            </p>
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
            <span>{isUk ? 'Загальні' : 'General'}</span>
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
            <span>{isUk ? 'База даних та сховище' : 'Database & Storage'}</span>
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
                <CardTitle className="text-sm font-medium">
                  {isUk ? 'Профіль користувача' : 'User Profile'}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isUk
                  ? 'Інформація поточного сеансу та рівень доступу'
                  : 'Current session credentials and role permissions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {isUk ? 'Повне ім’я' : 'Full Name'}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {user?.fullName || 'Client User'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Email</span>
                  <span className="text-xs font-semibold text-foreground font-mono">
                    {user?.email}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {isUk ? 'Роль в системі' : 'Role'}
                  </span>
                  <div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {user?.role}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {isUk ? 'Безпека ключів' : 'Key Security'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                    <Shield className="size-3.5 text-muted-foreground" />
                    <span>OS Keychain Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Appearance & Interface Preferences Card */}
          <Card className="border-border bg-card shadow-sm overflow-visible relative z-30">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <Sliders className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  {isUk ? 'Оформлення та інтерфейс' : 'Appearance & Interface'}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {isUk
                  ? 'Налаштуйте тему оформлення, кольорову палітру та мову системи'
                  : 'Customize theme mode, shadcn color palette, and language'}
              </CardDescription>
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
