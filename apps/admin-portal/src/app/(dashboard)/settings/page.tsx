'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeCustomizer } from '@/components/theme/theme-customizer';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div data-testid="settings-page" className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Sleek Minimalist Page Header */}
      <div>
        <h1
          data-testid="settings-header-title"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5"
        >
          <Settings className="size-6 text-primary shrink-0" />
          <span>{t('settings', 'title')}</span>
        </h1>
        <p data-testid="settings-header-subtitle" className="text-sm text-muted-foreground mt-0.5">
          {t('settings', 'subtitle')}
        </p>
      </div>

      {/* Top Section: Executive Administrator Profile Card */}
      <ProfileInfoCard user={user} />

      {/* Bottom Section: 2 Balanced Columns for Security & Appearance */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* Left Column: Account Security & Password */}
        <ChangePasswordCard />

        {/* Right Column: Appearance & Theming */}
        <ThemeCustomizer />
      </div>
    </div>
  );
}
