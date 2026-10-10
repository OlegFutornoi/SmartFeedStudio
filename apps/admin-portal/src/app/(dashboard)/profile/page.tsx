'use client';

import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard';

export default function ProfilePage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  return (
    <div
      data-testid="profile-page"
      className="space-y-6 w-full animate-in fade-in duration-300 max-w-5xl"
    >
      <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <User className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {isUk ? 'Профіль адміністратора' : 'Administrator Profile'}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {isUk
            ? 'Керування персональними даними, аватаром та безпекою доступу'
            : 'Manage personal credentials, avatar and access security'}
        </p>
      </div>

      {/* Top Section: Administrator Profile Card */}
      <ProfileInfoCard user={user} />

      {/* Bottom Section: Security & Password Change */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <ChangePasswordCard />
      </div>
    </div>
  );
}
