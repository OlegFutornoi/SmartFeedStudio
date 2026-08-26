import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { getMyLicense, getTariffPlans, selectTariffPlan } from '@/lib/api';
import { PlanCard, PlanItem } from '@/components/plans/PlanCard';
import { Button } from '@/components/ui/button';

export const PlansPage: React.FC = () => {
  const { token } = useAuth();
  const { refreshNavigation } = useNavigation();
  const { t } = useTranslation(['plans', 'common', 'errors']);

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [currentLicense, setCurrentLicense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [plansData, licenseData] = await Promise.all([getTariffPlans(), getMyLicense(token)]);
      setPlans(plansData);
      setCurrentLicense(licenseData);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, t));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPlan = async (planCode: string) => {
    if (!token) return;
    setIsSubmitting(planCode);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedLicense = await selectTariffPlan(token, planCode);
      setCurrentLicense(updatedLicense);
      setSuccessMessage(t('plans.planSwitchedSuccess'));
      await refreshNavigation();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, t));
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

      {/* Plan Cards Grid */}
      {isLoading ? (
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
