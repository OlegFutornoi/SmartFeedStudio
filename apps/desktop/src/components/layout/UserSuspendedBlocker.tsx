import React from 'react';
import { ShieldAlert, Mail, LogOut } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
      className="flex min-h-[60vh] w-full items-center justify-center p-4 animate-in fade-in-50 duration-300"
      data-testid="user-suspended-blocker"
    >
      <Card className="max-w-md w-full border-border bg-card/95 backdrop-blur shadow-xl text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-8 ring-destructive/5">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground" data-testid="suspended-title">
            {t('auth.accountSuspendedTitle')}
          </CardTitle>
          <CardDescription
            className="text-sm text-muted-foreground mt-2 leading-relaxed"
            data-testid="suspended-desc"
          >
            {t('auth.accountSuspendedDesc')}
          </CardDescription>
        </CardHeader>

        {user?.email && (
          <CardContent className="pt-2 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground font-mono">
              <span>{user.email}</span>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-2 pt-4">
          <Button
            onClick={handleContactSupport}
            className="w-full gap-2 shadow-sm font-semibold"
            size="lg"
            data-testid="contact-support-button"
          >
            <Mail className="h-4 w-4" />
            <span>{t('auth.contactSupport')}</span>
          </Button>

          <Button
            onClick={logout}
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
            size="default"
            data-testid="suspended-logout-button"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('auth.logout')}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
