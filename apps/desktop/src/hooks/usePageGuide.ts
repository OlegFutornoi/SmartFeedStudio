import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPageGuide } from '@/services/page-guides';
import { useDataSync } from '@/lib/syncEvents';
import { DEFAULT_PAGE_GUIDES, type PageGuideDto } from '@smartfeed/shared';

export interface PageGuideState {
  guide: PageGuideDto;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function usePageGuide(route: string): PageGuideState {
  const { token } = useAuth();
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  const initialGuide =
    DEFAULT_PAGE_GUIDES[normalizedRoute] ||
    (normalizedRoute === '/ai-enrichment' ? DEFAULT_PAGE_GUIDES['/ai'] : undefined) ||
    DEFAULT_PAGE_GUIDES['/'];

  const [guide, setGuide] = useState<PageGuideDto>(initialGuide);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const lastFetchedKeyRef = useRef<string | null>(null);

  const fetchGuide = useCallback(
    async (force = false) => {
      const key = `${normalizedRoute}:${token || 'anon'}`;
      if (!force && lastFetchedKeyRef.current === key) return;

      try {
        setIsLoading(true);
        const data = await getPageGuide(normalizedRoute, token || undefined);
        lastFetchedKeyRef.current = key;
        setGuide((prev) => {
          if (
            prev.route === data.route &&
            prev.titleUk === data.titleUk &&
            prev.assistant?.name === data.assistant?.name
          ) {
            return prev;
          }
          return data;
        });
      } catch {
        setGuide(initialGuide);
      } finally {
        setIsLoading(false);
      }
    },
    [normalizedRoute, token, initialGuide],
  );

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  useDataSync(['settings', 'all'], () => {
    fetchGuide(true);
  });

  return {
    guide,
    isLoading,
    refresh: () => fetchGuide(true),
  };
}
