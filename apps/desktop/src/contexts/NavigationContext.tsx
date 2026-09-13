import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { NavigationItemDto, Role, TargetApp, PlanType } from '@smartfeed/shared';
import { useAuth } from './AuthContext';
import { getDesktopNavigation } from '../lib/api';

const DEFAULT_NAVIGATION_ITEMS: NavigationItemDto[] = [
  {
    id: 'default-dashboard',
    key: 'dashboard',
    labelUk: 'Дашборд',
    labelEn: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    order: 1,
    isVisible: true,
    requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.DESKTOP,
  },
  {
    id: 'default-catalogs',
    key: 'catalogs',
    labelUk: 'Каталоги товарів',
    labelEn: 'Product Catalogs',
    path: '/catalogs',
    icon: 'Layers',
    order: 2,
    isVisible: true,
    requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.DESKTOP,
  },
  {
    id: 'default-ai',
    key: 'ai_enrichment',
    labelUk: 'AI Асистент',
    labelEn: 'AI Assistant',
    path: '/ai-enrichment',
    icon: 'Sparkles',
    order: 3,
    isVisible: true,
    requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    requiredPlan: PlanType.GROWTH,
    targetApp: TargetApp.DESKTOP,
  },
  {
    id: 'default-cloud',
    key: 'cloud_sync',
    labelUk: 'Хмарна синхронізація',
    labelEn: 'Cloud Sync',
    path: '/cloud-sync',
    icon: 'Cloud',
    order: 4,
    isVisible: true,
    requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    requiredPlan: PlanType.GROWTH,
    targetApp: TargetApp.DESKTOP,
  },
  {
    id: 'default-plans',
    key: 'plans',
    labelUk: 'Тарифи',
    labelEn: 'Plans & Pricing',
    path: '/plans',
    icon: 'CreditCard',
    order: 5,
    isVisible: true,
    requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.DESKTOP,
  },
  {
    id: 'default-team',
    key: 'team',
    labelUk: 'Команда',
    labelEn: 'Team',
    path: '/team',
    icon: 'Users',
    order: 6,
    isVisible: true,
    requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.DESKTOP,
  },
];

interface NavigationContextType {
  items: NavigationItemDto[];
  isLoading: boolean;
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<NavigationItemDto[]>(DEFAULT_NAVIGATION_ITEMS);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const lastFetchedTokenRef = React.useRef<string | null>(null);
  const isFetchingRef = React.useRef<boolean>(false);

  const fetchNavigation = useCallback(
    async (force = false) => {
      if (!token || !isAuthenticated) {
        lastFetchedTokenRef.current = null;
        setItems(DEFAULT_NAVIGATION_ITEMS);
        return;
      }

      if (!force && lastFetchedTokenRef.current === token) {
        return;
      }

      if (isFetchingRef.current) {
        return;
      }

      try {
        isFetchingRef.current = true;
        setIsLoading(true);
        const data = await getDesktopNavigation(token);
        lastFetchedTokenRef.current = token;
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems(DEFAULT_NAVIGATION_ITEMS);
        }
      } catch (e) {
        console.warn('[NavigationContext:fetchNavigation] Failed to fetch navigation items:', e);
        setItems(DEFAULT_NAVIGATION_ITEMS);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token, isAuthenticated],
  );

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const visibleItems = useMemo(() => {
    const isInvitedMember = Boolean(user?.organization && user.organization.role !== 'OWNER');
    if (isInvitedMember) {
      return items.filter((item) => item.key !== 'plans' && item.path !== '/plans');
    }
    return items;
  }, [items, user?.organization]);

  const value: NavigationContextType = useMemo(
    () => ({
      items: visibleItems,
      isLoading,
      refreshNavigation: () => fetchNavigation(true),
    }),
    [visibleItems, isLoading, fetchNavigation],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
