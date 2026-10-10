import { User } from 'lucide-react';
import { ProfileAvatarCard } from '@/components/profile/ProfileAvatarCard';
import { ProfileDetailsCard } from '@/components/profile/ProfileDetailsCard';
import { useTranslation } from '@/i18n';

export function ProfilePage() {
  const { t } = useTranslation(['settings', 'common']);

  return (
    <div
      data-testid="profile-page"
      className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300"
    >
      {/* Top Header section */}
      <div className="flex flex-col gap-1 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <User className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {t('settings:profileTitle')}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">{t('settings:profileSubtitle')}</p>
      </div>

      {/* 1. Avatar Management Card */}
      <ProfileAvatarCard />

      {/* 2. Personal Information & Role Card */}
      <ProfileDetailsCard />
    </div>
  );
}
