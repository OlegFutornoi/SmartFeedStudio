import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, ArrowRight, ShieldAlert } from 'lucide-react';
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
import { useLicense } from '@/hooks/useLicense';

interface ExpiredPlanBlockerProps {
  featureName?: string;
}

export const ExpiredPlanBlocker: React.FC<ExpiredPlanBlockerProps> = ({ featureName }) => {
  const { t } = useTranslation(['plans', 'common']);
  const { license, hasNoLicense } = useLicense();
  const navigate = useNavigate();

  const isStarterTrial = license?.planType === 'STARTER';

  const title = hasNoLicense
    ? t('plans.noActiveLicenseTitle')
    : isStarterTrial
      ? t('plans.trialExpiredTitle')
      : t('plans.licenseExpiredTitle');

  const description = hasNoLicense
    ? t('plans.noActiveLicenseDesc')
    : isStarterTrial
      ? t('plans.trialExpiredDesc')
      : t('plans.licenseExpiredDesc');

  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center p-4 animate-in fade-in-50 duration-300"
      data-testid="expired-plan-blocker"
    >
      <Card className="max-w-md w-full border-amber-500/30 bg-card/95 backdrop-blur shadow-xl shadow-amber-500/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
            {hasNoLicense ? (
              <ShieldAlert className="h-7 w-7" />
            ) : (
              <AlertTriangle className="h-7 w-7" />
            )}
          </div>
          <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>

        {featureName && (
          <CardContent className="text-center pt-2 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground font-medium">
              <span>{featureName}</span>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-2 pt-4">
          <Button
            onClick={() => navigate('/plans')}
            className="w-full gap-2 shadow-sm font-semibold"
            size="lg"
            data-testid="choose-plan-button"
          >
            <CreditCard className="h-4 w-4" />
            <span>{t('plans.goToPlans')}</span>
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
