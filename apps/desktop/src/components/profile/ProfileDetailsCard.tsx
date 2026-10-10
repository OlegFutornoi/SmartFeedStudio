import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Building2,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/hooks/useLicense';
import { useTranslation } from '@/i18n';

export const ProfileDetailsCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { license, daysRemaining, isExpired } = useLicense();
  const { t, language } = useTranslation(['settings', 'common']);
  const isUk = language === 'uk';

  const planCode = license?.planType || 'STARTER';
  const isUnlimited =
    planCode === 'ENTERPRISE' || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const planName =
    license?.tariffPlan?.nameUk && isUk
      ? license.tariffPlan.nameUk
      : license?.tariffPlan?.nameEn || license?.planType || 'STARTER';

  const planPeriod = isExpired
    ? t('settings:expired')
    : isUnlimited
      ? t('settings:unlimited')
      : t('settings:daysRemaining', { days: daysRemaining });

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">{t('settings:profile')}</CardTitle>
        </div>
        <CardDescription className="text-xs">{t('settings:profileDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User attributes grid */}
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
            <span className="text-xs font-semibold text-foreground font-mono">{user?.email}</span>
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

          {user?.organization ? (
            <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t('settings:organization')}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span className="truncate">{user.organization.name}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t('settings:keySecurity')}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                <Shield className="size-3.5 text-muted-foreground" />
                <span>{t('settings:keySecurityDesc')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Tier & Connection Status Banner */}
        <div className="p-3 rounded-lg border border-border/80 bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-card border border-border/70 text-primary shrink-0">
              {isExpired ? (
                <AlertTriangle className="size-4 text-destructive" />
              ) : planCode === 'PRO' || planCode === 'GROWTH' ? (
                <Zap className="size-4 text-primary" />
              ) : planCode === 'ENTERPRISE' ? (
                <Sparkles className="size-4 text-primary" />
              ) : (
                <ShieldCheck className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{planName}</span>
                <span className="text-muted-foreground text-[10px]">•</span>
                <span
                  className={`text-[11px] font-medium ${isExpired ? 'text-destructive font-bold' : 'text-muted-foreground'}`}
                >
                  {planPeriod}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
                <span>
                  {t('settings:systemStatus')}: {t('settings:online')}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/plans')}
            className="h-8 text-xs font-medium gap-1 self-start sm:self-auto bg-card hover:bg-muted"
          >
            <span>{t('settings:managePlans')}</span>
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
