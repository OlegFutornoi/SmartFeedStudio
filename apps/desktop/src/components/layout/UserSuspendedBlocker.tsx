import React from 'react';
import {
  ShieldAlert,
  Mail,
  LogOut,
  Bot,
  Sparkles,
  CheckCircle2,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';

export const UserSuspendedBlocker: React.FC = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { logout, user } = useAuth();

  const handleContactSupport = () => {
    const subject = encodeURIComponent(`Account Suspension Inquiry - ${user?.email || ''}`);
    const body = encodeURIComponent(
      `Hello Support Team,\n\nMy account (${user?.email || ''}) is suspended. Please provide details regarding the status.\n\nThank you,`,
    );
    window.open(`mailto:support@smartfeed.studio?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto rounded-2xl border border-border/80 bg-card/95 dark:bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 animate-in fade-in-50 zoom-in-95 duration-300"
      data-testid="user-suspended-blocker"
    >
      {/* 1. Left Showcase: AI Assistant & Security Copilot (NexaCRM 2-column style) */}
      <div className="md:col-span-5 bg-gradient-to-b from-muted/50 via-muted/20 to-background dark:from-muted/25 dark:via-background dark:to-card/80 border-b md:border-b-0 md:border-r border-border/60 p-6 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-2 relative z-10">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
            SF
          </div>
          <span className="font-semibold text-xs tracking-tight text-foreground">
            SmartFeed Studio
          </span>
          <span className="ml-auto text-2xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
            SECURITY
          </span>
        </div>

        {/* AI Copilot Visual */}
        <div className="my-6 flex flex-col items-center text-center relative z-10">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-destructive/20 blur-md" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-b from-destructive/20 to-destructive/5 border border-destructive/30 flex items-center justify-center text-destructive shadow-inner">
              <Bot className="h-10 w-10 text-destructive drop-shadow" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border border-destructive/30 flex items-center justify-center text-destructive shadow-sm">
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium mb-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Security Sentinel</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
            {t('auth.aiSecurityStatus', {
              defaultValue: 'Автоматичний захист контурів та збереження локального каталогу',
            })}
          </p>
        </div>

        {/* Status Indicators */}
        <div className="space-y-1.5 border-t border-border/40 pt-4 text-xs text-muted-foreground relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span>{t('auth.catalogDataState', { defaultValue: 'Стан каталогу' })}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />{' '}
              {t('auth.catalogProtected', { defaultValue: 'Захищено' })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>{t('auth.localStorageState', { defaultValue: 'Локальна база' })}</span>
            <span className="font-mono text-foreground/80">SQLite Encr.</span>
          </div>
        </div>
      </div>

      {/* 2. Right Content & Actions: Suspension Notice */}
      <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between bg-card/60">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
              <ShieldAlert className="h-3 w-3" />
              {t('auth.accountSuspendedBadge', { defaultValue: 'ПРИЗУПИНЕНО' })}
            </span>
          </div>

          <h2
            className="text-xl md:text-2xl font-bold tracking-tight text-foreground"
            data-testid="suspended-title"
          >
            {t('auth.accountSuspendedTitle')}
          </h2>

          <p
            className="text-xs text-muted-foreground mt-2 leading-relaxed"
            data-testid="suspended-desc"
          >
            {t('auth.accountSuspendedDesc')}
          </p>

          {user?.email && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/60 text-xs font-mono text-foreground">
              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
          )}

          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground block mb-0.5">
              {t('auth.nextStepsTitle', { defaultValue: 'Що потрібно зробити?' })}
            </span>
            {t('auth.nextStepsDesc', {
              defaultValue:
                "Зв'яжіться зі службою підтримки для верифікації та швидкого відновлення доступу.",
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-border/40">
          <Button
            onClick={handleContactSupport}
            className="flex-1 gap-2 shadow-sm font-semibold"
            size="default"
            data-testid="contact-support-button"
          >
            <Mail className="h-4 w-4" />
            <span>{t('auth.contactSupport')}</span>
          </Button>

          <Button
            onClick={logout}
            variant="outline"
            className="gap-2 text-muted-foreground hover:text-foreground"
            size="default"
            data-testid="suspended-logout-button"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('auth.logout')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
