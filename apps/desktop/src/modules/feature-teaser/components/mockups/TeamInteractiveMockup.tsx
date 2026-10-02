import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Shield, User, Crown, Sparkles, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export const TeamInteractiveMockup: React.FC = () => {
  const { t } = useTranslation(['featureTeaser', 'common']);
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<'admin' | 'member'>('admin');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isMariaAdmin = selectedRole === 'admin';

  return (
    <div
      data-testid="interactive-team-mockup"
      className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {t('featureTeaser.team.mockup.title')}
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
            >
              Sandbox
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('featureTeaser.team.mockup.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          data-testid="mockup-invite-btn"
          onClick={() => setShowUpgradeModal(true)}
          className="shrink-0 gap-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>{t('featureTeaser.team.mockup.addMemberBtn')}</span>
        </Button>
      </div>

      {/* Interactive Member Rows */}
      <div className="space-y-2.5">
        {/* Row 1: Owner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 gap-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary border border-border text-foreground flex items-center justify-center font-bold text-xs">
              ОШ
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>Олександр Шевченко</span>
                <Crown className="h-3 w-3 text-foreground" />
              </div>
              <div className="text-[11px] text-muted-foreground">alex@business.ua</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-[11px] font-medium text-foreground">
                {t('featureTeaser.team.mockup.roles.owner')}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {t('featureTeaser.team.mockup.permissions.owner')}
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] bg-secondary text-secondary-foreground border-border"
            >
              {t('featureTeaser.team.mockup.activeStatus')}
            </Badge>
          </div>
        </div>

        {/* Row 2: Interactive Role Switcher for Maria */}
        <div
          data-testid="mockup-interactive-row"
          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border-2 border-primary/30 bg-primary/5 gap-3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs">
              МТ
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>Марія Ткачук</span>
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              </div>
              <div className="text-[11px] text-muted-foreground">maria@agency.com</div>
            </div>
          </div>

          {/* Role selector buttons */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block max-w-xs">
              <div className="text-[11px] font-medium text-foreground">
                {isMariaAdmin
                  ? t('featureTeaser.team.mockup.roles.admin')
                  : t('featureTeaser.team.mockup.roles.member')}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {isMariaAdmin
                  ? t('featureTeaser.team.mockup.permissions.admin')
                  : t('featureTeaser.team.mockup.permissions.member')}
              </div>
            </div>

            <div className="flex items-center bg-background border border-border rounded-lg p-0.5">
              <button
                type="button"
                data-testid="mockup-select-admin"
                onClick={() => setSelectedRole('admin')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                  isMariaAdmin
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="h-3 w-3" />
                <span>{t('featureTeaser.team.mockup.roles.admin')}</span>
              </button>
              <button
                type="button"
                data-testid="mockup-select-member"
                onClick={() => setSelectedRole('member')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
                  !isMariaAdmin
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="h-3 w-3" />
                <span>{t('featureTeaser.team.mockup.roles.member')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Regular Member */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 gap-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center font-bold text-xs">
              ДК
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">Дмитро Коваль</div>
              <div className="text-[11px] text-muted-foreground">dmitry@seller.com</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-[11px] font-medium text-foreground">
                {t('featureTeaser.team.mockup.roles.member')}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {t('featureTeaser.team.mockup.permissions.member')}
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {t('featureTeaser.team.mockup.activeStatus')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50 flex items-center justify-between">
        <span>{t('featureTeaser.team.mockup.tryActionHint')}</span>
        <span className="font-semibold text-primary">
          {t('featureTeaser.team.mockup.membersLimitNotice')}
        </span>
      </div>

      {/* Upgrade Callout Modal when clicking Invite Member */}
      {showUpgradeModal && (
        <div
          data-testid="mockup-upgrade-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-200"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {t('featureTeaser.common.lockedBadge', { plan: 'PRO' })}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('featureTeaser.team.heroSubtitle')}
            </p>

            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.team.dialog.benefit1')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.team.dialog.benefit2')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                <span>{t('featureTeaser.team.dialog.benefit3')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                data-testid="mockup-confirm-upgrade-btn"
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate('/plans?highlight=PRO');
                }}
                className="flex-1 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {t('featureTeaser.team.cta.button')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs font-medium"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
