import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { NavigationItemDto, Role, TargetApp } from '@smartfeed/shared';
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
    labelUk: 'AI Збагачення',
    labelEn: 'AI Enrichment',
    path: '/ai-enrichment',
    icon: 'Sparkles',
    order: 3,
    isVisible: true,
    requiredRoles: [Role.USER, Role.ADMIN, Role.SUPER_ADMIN],
    requiredPlan: null,
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
    requiredPlan: null,
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
];

interface NavigationContextType {
  items: NavigationItemDto[];
  isLoading: boolean;
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState<NavigationItemDto[]>(DEFAULT_NAVIGATION_ITEMS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNavigation = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setItems(DEFAULT_NAVIGATION_ITEMS);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getDesktopNavigation(token);
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      } else {
        setItems(DEFAULT_NAVIGATION_ITEMS);
      }
    } catch {
      setItems(DEFAULT_NAVIGATION_ITEMS);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const value: NavigationContextType = useMemo(
    () => ({
      items,
      isLoading,
      refreshNavigation: fetchNavigation,
    }),
    [items, isLoading, fetchNavigation],
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
