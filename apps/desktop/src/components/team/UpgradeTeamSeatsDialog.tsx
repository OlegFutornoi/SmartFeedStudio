import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, Crown, ArrowRight, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

interface UpgradeTeamSeatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  isLimitReached?: boolean;
}

export const UpgradeTeamSeatsDialog: React.FC<UpgradeTeamSeatsDialogProps> = ({
  isOpen,
  onClose,
  currentPlan = 'STARTER',
  isLimitReached = false,
}) => {
  const { t } = useTranslation(['team', 'common']);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigateToPlans = () => {
    onClose();
    navigate('/plans');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
      data-testid="upgrade-team-dialog"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          data-testid="close-upgrade-dialog-btn"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t('team.cancel')}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">{t('team.upgradeModalTitle')}</h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-primary/30 text-primary"
              >
                {currentPlan}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('team.upgradeModalSubtitle')}</p>
          </div>
        </div>

        {/* Description Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 mb-5 text-xs text-muted-foreground leading-relaxed">
          {isLimitReached ? t('team.upgradeModalLimitDesc') : t('team.upgradeModalStarterDesc')}
        </div>

        {/* Tiers Comparison Grid */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {/* PRO Tier Card */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-muted/20 p-4 hover:border-primary/40 transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <span>PRO</span>
                </span>
                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                  3 місця
                </Badge>
              </div>
              <ul className="space-y-2 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t('team.proBenefit1')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t('team.proBenefit2')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{t('team.proBenefit3')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ENTERPRISE Tier Card */}
          <div className="flex flex-col justify-between rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-foreground" />
                  <span>ENTERPRISE</span>
                </span>
                <Badge
                  variant="default"
                  className="text-[9px] uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90"
                >
                  ∞ місць
                </Badge>
              </div>
              <ul className="space-y-2 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                  <span>{t('team.enterpriseBenefit1')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                  <span>{t('team.enterpriseBenefit2')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                  <span>{t('team.enterpriseBenefit3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="cancel-upgrade-dialog-btn"
          >
            {t('team.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleNavigateToPlans}
            data-testid="upgrade-to-plans-btn"
            className="gap-2 font-semibold shadow-sm"
          >
            <span>
              {currentPlan === 'PRO' ? t('team.upgradeToEnterprise') : t('team.upgradeToPro')}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
