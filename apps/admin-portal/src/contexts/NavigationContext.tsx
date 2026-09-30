'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { NavigationItemDto, Role, TargetApp } from '@smartfeed/shared';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

export const DEFAULT_ADMIN_NAVIGATION_ITEMS: NavigationItemDto[] = [
  {
    id: 'default-admin-dashboard',
    key: 'admin_dashboard',
    labelUk: 'Дашборд',
    labelEn: 'Dashboard',
    path: '/',
    icon: 'LayoutDashboard',
    order: 1,
    isVisible: true,
    requiredRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.ADMIN_PORTAL,
  },
  {
    id: 'default-admin-users',
    key: 'admin_users',
    labelUk: 'Користувачі',
    labelEn: 'Users',
    path: '/users',
    icon: 'Users',
    order: 2,
    isVisible: true,
    requiredRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.ADMIN_PORTAL,
  },
  {
    id: 'default-admin-plans',
    key: 'admin_plans',
    labelUk: 'Тарифи',
    labelEn: 'Tariff Plans',
    path: '/plans',
    icon: 'Layers',
    order: 3,
    isVisible: true,
    requiredRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.ADMIN_PORTAL,
  },
  {
    id: 'default-admin-licenses',
    key: 'admin_licenses',
    labelUk: 'Ліцензії',
    labelEn: 'Licenses',
    path: '/licenses',
    icon: 'KeyRound',
    order: 4,
    isVisible: true,
    requiredRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.ADMIN_PORTAL,
  },
  {
    id: 'default-admin-navigation',
    key: 'admin_navigation',
    labelUk: 'Навігація меню',
    labelEn: 'Navigation Menu',
    path: '/navigation',
    icon: 'Compass',
    order: 5,
    isVisible: true,
    requiredRoles: [Role.SUPER_ADMIN, Role.ADMIN],
    requiredPlan: null,
    targetApp: TargetApp.ADMIN_PORTAL,
  },
];

interface NavigationContextType {
  items: NavigationItemDto[];
  isLoading: boolean;
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState<NavigationItemDto[]>(DEFAULT_ADMIN_NAVIGATION_ITEMS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const lastFetchedTokenRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchNavigation = useCallback(
    async (force = false) => {
      if (!token || !user) {
        lastFetchedTokenRef.current = null;
        setItems(DEFAULT_ADMIN_NAVIGATION_ITEMS);
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
        const data = await api.getAdminNavigationItems(TargetApp.ADMIN_PORTAL);
        lastFetchedTokenRef.current = token;
        if (Array.isArray(data) && data.length > 0) {
          const adminOnly = data.filter(
            (i) =>
              i.isVisible &&
              (i.targetApp === TargetApp.ADMIN_PORTAL || i.targetApp === TargetApp.ALL),
          );
          if (adminOnly.length > 0) {
            setItems(adminOnly.sort((a, b) => a.order - b.order));
          } else {
            setItems(DEFAULT_ADMIN_NAVIGATION_ITEMS);
          }
        } else {
          setItems(DEFAULT_ADMIN_NAVIGATION_ITEMS);
        }
      } catch (e) {
        console.warn(
          '[NavigationContext:fetchNavigation] Failed to fetch admin navigation items:',
          e,
        );
        setItems(DEFAULT_ADMIN_NAVIGATION_ITEMS);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token, user],
  );

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  const value: NavigationContextType = useMemo(
    () => ({
      items,
      isLoading,
      refreshNavigation: () => fetchNavigation(true),
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
