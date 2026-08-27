import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { getMyLicense, getTariffPlans, selectTariffPlan } from '@/lib/api';
import { PlanCard, PlanItem } from '@/components/plans/PlanCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { LicenseEntity } from '@smartfeed/shared';

export const PlansPage: React.FC = () => {
  const { token, user } = useAuth();
  const { refreshNavigation } = useNavigation();
  const { t } = useTranslation(['plans', 'common', 'errors']);

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [currentLicense, setCurrentLicense] = useState<LicenseEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown>(null);
  const errorMessage = useMemo(
    () => (rawError ? getErrorMessage(rawError, t) : null),
    [rawError, t],
  );

  const isInvitedMember = Boolean(user?.organization && user.organization.role !== 'OWNER');

  const loadData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setRawError(null);

    try {
      const [plansData, licenseData] = await Promise.all([
        getTariffPlans(),
        getMyLicense(token).catch(() => null),
      ]);
      setPlans(plansData || []);
      setCurrentLicense(licenseData);
    } catch (err) {
      setRawError(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPlan = async (planCode: string) => {
    if (!token) return;
    setIsSubmitting(planCode);
    setRawError(null);
    setSuccessMessage(null);

    try {
      const updatedLicense = await selectTariffPlan(token, planCode);
      setCurrentLicense(updatedLicense);
      setSuccessMessage(t('plans.planSwitchedSuccess'));
      await refreshNavigation();
    } catch (err) {
      setRawError(err);
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 pb-12" data-testid="plans-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <span>{t('plans.title')}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">{t('plans.subtitle')}</p>
        </div>

        <Button
          variant="outline"
          size="icon"
          data-testid="refresh-plans-button"
          onClick={loadData}
          disabled={isLoading}
          className="h-9 w-9 self-start md:self-auto shrink-0"
          title={t('common.refresh')}
          aria-label={t('common.refresh')}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div
          data-testid="plans-success-alert"
          className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div
          data-testid="plans-error-alert"
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm font-medium"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Expiration Banner */}
      {currentLicense?.isExpired && (
        <div
          data-testid="expired-license-banner"
          className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400 text-sm font-medium"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{t('plans.licenseExpiredDesc')}</span>
        </div>
      )}

      {/* Invited Member Corporate Info Card */}
      {isInvitedMember ? (
        <div
          data-testid="invited-member-plan-card"
          className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 md:p-8 space-y-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {user?.organization?.name || 'Корпоративний воркспейс'}
                </h2>
                <p className="text-xs text-muted-foreground">{t('plans.corporateLicenseNotice')}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 self-start sm:self-auto"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              {currentLicense?.planType || 'PRO'}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('plans.managedByOwnerDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-xs text-muted-foreground">{t('plans.xmlQuota')}</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {currentLicense?.maxXmlLimit
                  ? currentLicense.maxXmlLimit.toLocaleString()
                  : '50,000'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-xs text-muted-foreground">{t('plans.aiCreditsQuota')}</div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                {currentLicense?.aiCredits ? currentLicense.aiCredits.toLocaleString() : '2,000'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="text-xs text-muted-foreground">{t('plans.cloudBackup')}</div>
              <div className="text-lg font-bold text-emerald-500 mt-0.5">
                {currentLicense?.canCloudBackup ? 'S3 MinIO / AWS' : 'Ні'}
              </div>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanCode={currentLicense?.planType}
              isExpired={currentLicense?.isExpired}
              daysRemaining={currentLicense?.daysRemaining}
              isLoading={isSubmitting === plan.code}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      )}
    </div>
  );
};
