'use client';

import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ThemeCustomizer } from '../../../components/theme/theme-customizer';
import { ProfileInfoCard } from '../../../components/profile/ProfileInfoCard';
import { InfrastructureStatusCard } from '../../../components/profile/InfrastructureStatusCard';
import { ChangePasswordCard } from '../../../components/profile/ChangePasswordCard';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div
      data-testid="settings-page"
      className="space-y-8 max-w-4xl animate-in fade-in duration-300"
    >
      {/* Header */}
      <div>
        <h1
          data-testid="settings-header-title"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {t('settings', 'title')}
        </h1>
        <p data-testid="settings-header-subtitle" className="text-sm text-muted-foreground mt-1">
          {t('settings', 'subtitle')}
        </p>
      </div>

      {/* 1. Theme and Appearance Customizer */}
      <ThemeCustomizer />

      {/* 2. Admin Profile & Infrastructure */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileInfoCard user={user} />
        <InfrastructureStatusCard />
      </div>

      {/* 3. Change Password Card */}
      <ChangePasswordCard />
    </div>
  );
}
