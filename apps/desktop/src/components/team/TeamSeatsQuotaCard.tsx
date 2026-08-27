import React from 'react';
import { Users, UserPlus, Sparkles, AlertCircle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

interface TeamSeatsQuotaCardProps {
  usedSeats: number;
  maxSeats: number;
  isOwnerOrAdmin?: boolean;
  onOpenInvite: () => void;
  onOpenUpgrade: () => void;
}

export const TeamSeatsQuotaCard: React.FC<TeamSeatsQuotaCardProps> = ({
  usedSeats,
  maxSeats,
  isOwnerOrAdmin = true,
  onOpenInvite,
  onOpenUpgrade,
}) => {
  const { t } = useTranslation(['team', 'common']);

  const isUnlimited = maxSeats >= 999;
  const isSoloPlan = maxSeats <= 1;
  const isLimitReached = !isUnlimited && usedSeats >= maxSeats;
  const percentage = isUnlimited
    ? Math.min(100, usedSeats * 10)
    : Math.min(100, Math.round((usedSeats / maxSeats) * 100));

  const remainingSeats = isUnlimited ? 999 : Math.max(0, maxSeats - usedSeats);

  const handleButtonClick = () => {
    if (isSoloPlan || isLimitReached) {
      onOpenUpgrade();
    } else {
      onOpenInvite();
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm" data-testid="team-seats-quota-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">{t('team.seatsTitle')}</CardTitle>
              {isSoloPlan ? (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {t('team.soloPlanBadge')}
                </Badge>
              ) : isLimitReached ? (
                <Badge variant="destructive" className="text-[10px]">
                  {t('team.limitReachedBadge')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  {remainingSeats === 1
                    ? t('team.seatsRemaining', { count: remainingSeats })
                    : t('team.seatsRemainingPlural', { count: remainingSeats })}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-0.5">
              {isUnlimited
                ? t('team.seatsUsedUnlimited', { used: usedSeats })
                : t('team.seatsUsed', { used: usedSeats, max: maxSeats })}
            </CardDescription>
          </div>

          {/* Action button - ALWAYS clickable as requested by user */}
          {isOwnerOrAdmin && (
            <Button
              type="button"
              size="sm"
              onClick={handleButtonClick}
              data-testid="invite-member-btn"
              className="gap-2 font-semibold shadow-sm shrink-0"
              variant={isSoloPlan || isLimitReached ? 'outline' : 'default'}
            >
              {isSoloPlan || isLimitReached ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{t('team.inviteMember')}</span>
                  <Badge
                    variant="secondary"
                    className="ml-1 text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20"
                  >
                    {isLimitReached ? 'PRO+' : 'Upgrade'}
                  </Badge>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>{t('team.inviteMember')}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isLimitReached ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
            <span data-testid="seats-count-label">
              {usedSeats} / {isUnlimited ? '∞' : maxSeats}
            </span>
            <span>{isUnlimited ? 'Unlimited' : `${percentage}%`}</span>
          </div>
        </div>

        {/* Informative notification box */}
        {isSoloPlan && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl border border-primary/20 bg-primary/[0.04] text-xs text-muted-foreground"
            data-testid="solo-plan-notice"
          >
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium text-foreground">{t('team.soloPlanDesc')}</span>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="ml-1.5 text-primary hover:underline font-semibold"
              >
                Дізнатися більше →
              </button>
            </div>
          </div>
        )}

        {isLimitReached && !isSoloPlan && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] text-xs text-muted-foreground"
            data-testid="limit-reached-notice"
          >
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-medium text-foreground">{t('team.limitReachedDesc')}</span>
              <button
                type="button"
                onClick={onOpenUpgrade}
                className="ml-1.5 text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                Оновити до ENTERPRISE →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
