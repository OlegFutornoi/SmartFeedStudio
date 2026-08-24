'use client';

import React, { useState } from 'react';
import { PlanType, TargetApp, NavigationItemDto } from '@smartfeed/shared';
import { Monitor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getIconComponent } from './constants';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

const PLAN_HIERARCHY: Record<PlanType, number> = {
  [PlanType.FREE]: 1,
  [PlanType.PRO]: 2,
  [PlanType.ENTERPRISE]: 3,
};

interface NavigationLivePreviewProps {
  items: NavigationItemDto[];
}

export const NavigationLivePreview = React.memo(function NavigationLivePreview({
  items,
}: NavigationLivePreviewProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.FREE);
  const { t, locale } = useLanguage();

  const desktopItems = items.filter((i) => i.targetApp === TargetApp.DESKTOP);
  const visibleItems = desktopItems.filter(
    (item) =>
      item.isVisible &&
      (!item.requiredPlan || PLAN_HIERARCHY[selectedPlan] >= PLAN_HIERARCHY[item.requiredPlan]),
  );

  return (
    <Card
      data-testid="navigation-simulator-card"
      className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm sticky top-24"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Monitor className="h-4 w-4 text-primary" />
          {t('navigation', 'simulator_title')}
        </CardTitle>
        <CardDescription className="text-xs">{t('navigation', 'simulator_desc')}</CardDescription>

        {/* Plan Tiers Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40 mt-2">
          {([PlanType.FREE, PlanType.PRO, PlanType.ENTERPRISE] as const).map((plan) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={cn(
                'py-1 text-xs rounded-lg font-medium transition-all text-center',
                selectedPlan === plan
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {plan === PlanType.FREE
                ? 'Free Plan'
                : plan === PlanType.PRO
                  ? 'PRO Plan'
                  : 'Enterprise'}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Simulated Sidebar Container */}
        <div className="rounded-xl border border-border/70 bg-card/90 p-4 space-y-3 shadow-inner">
          <div className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase px-2">
            {t('navigation', 'user_menu_preview')} ({selectedPlan})
          </div>

          <div className="space-y-1.5">
            {visibleItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Немає доступних пунктів для цього тарифу
              </div>
            ) : (
              visibleItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground bg-muted/30 border border-border/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="text-primary">{getIconComponent(item.icon)}</div>
                  <span>{locale === 'uk' ? item.labelUk : item.labelEn}</span>
                </div>
              ))
            )}
          </div>

          <div className="text-[11px] text-center text-muted-foreground/80 pt-2 border-t border-border/40 font-mono">
            {t('navigation', 'available_items_count', {
              available: visibleItems.length,
              total: desktopItems.length,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
