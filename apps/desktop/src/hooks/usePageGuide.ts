import { useState, useEffect, useCallback } from 'react';
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
  const initialGuide = DEFAULT_PAGE_GUIDES[normalizedRoute] || DEFAULT_PAGE_GUIDES['/'];

  const [guide, setGuide] = useState<PageGuideDto>(initialGuide);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchGuide = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPageGuide(normalizedRoute, token || undefined);
      setGuide(data);
    } catch {
      setGuide(initialGuide);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedRoute, token, initialGuide]);

  useEffect(() => {
    fetchGuide();
  }, [fetchGuide]);

  useDataSync(['settings', 'all'], () => {
    fetchGuide();
  });

  return {
    guide,
    isLoading,
    refresh: fetchGuide,
  };
}
