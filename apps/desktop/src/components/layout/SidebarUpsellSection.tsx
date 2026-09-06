import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Sparkles, Users, Cloud, Sparkle, Layers, ShieldCheck } from 'lucide-react';
import { NavigationItemDto } from '@smartfeed/shared';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Cloud,
  Sparkles,
  Sparkle,
  Layers,
  ShieldCheck,
};

function renderItemIcon(iconName: string, className?: string) {
  const IconComponent = ICON_MAP[iconName] || Users;
  return <IconComponent className={className || 'h-4 w-4'} />;
}

interface SidebarUpsellSectionProps {
  upsellItems: NavigationItemDto[];
  isCollapsed: boolean;
  currentLang: string;
  onItemClick?: () => void;
}

export const SidebarUpsellSection: React.FC<SidebarUpsellSectionProps> = ({
  upsellItems,
  isCollapsed,
  currentLang,
  onItemClick,
}) => {
  const location = useLocation();
  const { t } = useTranslation(['featureTeaser']);

  if (!upsellItems || upsellItems.length === 0) {
    return null;
  }

  return (
    <div data-testid="sidebar-upsell-section" className="pt-2">
      {/* Divider */}
      <div className={cn('border-t border-border/70 my-2', isCollapsed ? 'mx-2' : 'mx-3')} />

      {/* Header */}
      {!isCollapsed ? (
        <div className="px-3 pb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted-foreground/70 tracking-wider uppercase">
          <span>{t('featureTeaser.sidebar.upsellHeader')}</span>
        </div>
      ) : (
        <div className="flex justify-center pb-1">
          <Lock className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}

      {/* Upsell Items */}
      <div className="space-y-0.5">
        {upsellItems.map((item) => {
          const label = currentLang === 'uk' ? item.labelUk : item.labelEn;
          const isActive =
            item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);

          const badgeText = item.requiredPlan || 'PRO';

          return (
            <Link
              key={item.id || item.key}
              to={item.path}
              onClick={onItemClick}
              title={`${label} (${badgeText})`}
              data-testid={`nav-item-${item.key}`}
              data-upsell-item={item.key}
              className={cn(
                'flex items-center text-sm font-medium transition-all group relative border-l-2 border-transparent',
                isCollapsed ? 'justify-center h-10 w-10 mx-auto px-0' : 'space-x-3 px-3 py-2',
                isActive
                  ? 'bg-primary/10 text-primary border-primary font-semibold'
                  : 'text-muted-foreground/80 hover:text-foreground hover:bg-muted/40',
              )}
            >
              {renderItemIcon(
                item.icon,
                cn(
                  'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                  isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-primary',
                ),
              )}

              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{label}</span>
                  <span className="sr-only">{badgeText}</span>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 ml-2" />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
