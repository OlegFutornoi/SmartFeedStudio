import { useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/i18n';
import { useLicense } from '@/hooks/useLicense';
import { Badge } from '@/components/ui/badge';
import { SidebarNavItem } from '@/components/layout/SidebarNavItem';
import { SidebarUserProfile } from '@/components/layout/SidebarUserProfile';
import { SidebarMobileDrawer } from '@/components/layout/SidebarMobileDrawer';
import { SidebarUpsellSection } from '@/components/layout/SidebarUpsellSection';
import { PLAN_LEVEL, FEATURE_TEASER_REGISTRY } from '@/modules/feature-teaser';
import { NavigationItemDto, PlanType, Role, TargetApp } from '@smartfeed/shared';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { items } = useNavigation();
  const { language } = useTranslation();
  const { license, isExpired } = useLicense();

  const currentLang = language || 'uk';

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/auth/login');
  }, [logout, navigate]);

  const { primaryNavItems, upsellNavItems } = useMemo(() => {
    const primary: typeof items = [];
    const upsell: typeof items = [];

    const searchParams = new URLSearchParams(location.search);
    const isPreviewForced = searchParams.get('preview') === 'teaser';

    const isAdmin = !isPreviewForced && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN');

    items.forEach((item) => {
      let isItemLocked = false;

      if (!isAdmin) {
        if (item.key === 'team') {
          const isInvitedMember = Boolean(user?.organization && user.organization.role !== 'OWNER');
          const currentLevel = PLAN_LEVEL[license?.planType as PlanType] ?? 1;
          if (!isInvitedMember && currentLevel < 3) {
            isItemLocked = true;
          }
        } else if (item.key === 'cloud_sync') {
          if (!license?.canCloudBackup) {
            isItemLocked = true;
          }
        } else if (item.key === 'ai_enrichment') {
          const currentLevel = PLAN_LEVEL[license?.planType as PlanType] ?? 1;
          if (currentLevel < 2) {
            isItemLocked = true;
          }
        } else if (item.requiredPlan) {
          const currentLevel = PLAN_LEVEL[license?.planType as PlanType] ?? 1;
          const requiredLevel = PLAN_LEVEL[item.requiredPlan] ?? 1;
          if (currentLevel < requiredLevel) {
            isItemLocked = true;
          }
        }
      }

      if (isItemLocked) {
        upsell.push({
          ...item,
          requiredPlan: item.requiredPlan || (item.key === 'team' ? PlanType.PRO : PlanType.GROWTH),
        });
      } else {
        primary.push(item);
      }
    });

    // Ensure registered teaser features from FEATURE_TEASER_REGISTRY are present in the sidebar
    // even if backend filtered them out from accessible navigation for users on lower plans (e.g. Starter).
    const TEASER_DEFAULTS: Record<string, Partial<NavigationItemDto>> = {
      team: {
        key: 'team',
        labelUk: 'Команда',
        labelEn: 'Team',
        path: '/team',
        icon: 'Users',
        order: 7,
        isVisible: true,
        requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
        requiredPlan: PlanType.PRO,
        targetApp: TargetApp.DESKTOP,
      },
      cloud_sync: {
        key: 'cloud_sync',
        labelUk: 'Хмарна синхронізація',
        labelEn: 'Cloud Sync',
        path: '/cloud-sync',
        icon: 'Cloud',
        order: 8,
        isVisible: true,
        requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
        requiredPlan: PlanType.GROWTH,
        targetApp: TargetApp.DESKTOP,
      },
      ai_enrichment: {
        key: 'ai_enrichment',
        labelUk: 'AI Асистент',
        labelEn: 'AI Assistant',
        path: '/ai-enrichment',
        icon: 'Sparkles',
        order: 9,
        isVisible: true,
        requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
        requiredPlan: PlanType.GROWTH,
        targetApp: TargetApp.DESKTOP,
      },
    };

    Object.entries(FEATURE_TEASER_REGISTRY).forEach(([featKey, featConfig]) => {
      const existsInPrimary = primary.some((p) => p.key === featKey);
      const existsInUpsell = upsell.some((u) => u.key === featKey);

      if (!existsInPrimary && !existsInUpsell) {
        const defaultDef = TEASER_DEFAULTS[featKey] || {
          key: featKey,
          labelUk: featKey,
          labelEn: featKey,
          path: featConfig.path,
          icon: featConfig.icon,
          order: 99,
          isVisible: true,
          requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
          requiredPlan: featConfig.minPlan,
          targetApp: TargetApp.DESKTOP,
        };

        const itemToAdd = {
          id: `teaser-${featKey}`,
          ...defaultDef,
        } as NavigationItemDto;

        if (isAdmin) {
          primary.push(itemToAdd);
        } else {
          const currentLevel = PLAN_LEVEL[license?.planType as PlanType] ?? 1;
          const requiredLevel = PLAN_LEVEL[featConfig.minPlan] ?? 3;
          let isLocked = currentLevel < requiredLevel;

          if (featKey === 'team') {
            const isInvitedMember = Boolean(
              user?.organization && user.organization.role !== 'OWNER',
            );
            if (isInvitedMember) isLocked = false;
          } else if (featKey === 'cloud_sync') {
            if (license?.canCloudBackup) isLocked = false;
          } else if (featKey === 'ai_enrichment') {
            if (currentLevel < 2) isLocked = true;
            else isLocked = false;
          }

          if (isLocked) {
            upsell.push(itemToAdd);
          } else {
            primary.push(itemToAdd);
          }
        }
      }
    });

    return { primaryNavItems: primary, upsellNavItems: upsell };
  }, [items, user, license, location.search]);

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        data-testid="desktop-sidebar"
        className={cn(
          'hidden md:flex flex-col justify-between h-screen sticky top-0 bg-transparent transition-all duration-300 z-20 select-none',
          isCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Brand Header */}
          <div
            className={cn(
              'flex items-center pt-3.5 pb-2',
              isCollapsed ? 'justify-center px-0' : 'px-3.5',
            )}
          >
            <button
              type="button"
              data-testid="sidebar-brand-button"
              onClick={() => navigate('/')}
              className={cn(
                'flex items-center overflow-hidden group cursor-pointer transition-colors',
                isCollapsed
                  ? 'justify-center h-10 w-10 mx-auto rounded-lg hover:bg-muted/40'
                  : 'gap-2.5 w-full text-left',
              )}
              title={isCollapsed ? 'SmartFeed Studio' : undefined}
            >
              <Layers className="h-6 w-6 text-foreground shrink-0 transition-colors group-hover:text-primary" />
              {!isCollapsed && (
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground tracking-tight">
                    SmartFeed
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 uppercase font-medium text-muted-foreground border-border/60"
                  >
                    Studio
                  </Badge>
                </div>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            className={cn(
              'space-y-0.5 flex-1 overflow-y-auto overflow-x-hidden py-2',
              isCollapsed ? 'px-0' : 'px-2',
            )}
            data-testid="desktop-sidebar-nav"
          >
            {primaryNavItems.map((item) => (
              <SidebarNavItem
                key={item.id || item.key}
                item={item}
                isCollapsed={isCollapsed}
                currentLang={currentLang}
                isExpired={isExpired}
              />
            ))}

            {/* Upsell Section for Premium / Locked Features */}
            <SidebarUpsellSection
              upsellItems={upsellNavItems}
              isCollapsed={isCollapsed}
              currentLang={currentLang}
            />
          </nav>
        </div>

        {/* User Footer Profile Card */}
        <SidebarUserProfile
          user={user}
          isCollapsed={isCollapsed}
          currentLang={currentLang}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Drawer / Overlay Sheet */}
      <SidebarMobileDrawer
        isOpen={isMobileOpen}
        items={primaryNavItems}
        upsellItems={upsellNavItems}
        user={user}
        currentLang={currentLang}
        onClose={closeMobileSidebar}
        onLogout={handleLogout}
      />
    </>
  );
}
