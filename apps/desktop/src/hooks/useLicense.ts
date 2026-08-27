import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyLicense } from '@/lib/api';
import type { LicenseEntity } from '@smartfeed/shared';

export function useLicense() {
  const { token, isAuthenticated } = useAuth();
  const [license, setLicense] = useState<LicenseEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const fetchLicense = useCallback(
    async (force = false) => {
      if (!token || !isAuthenticated) {
        setLicense(null);
        setIsExpired(false);
        setIsLoading(false);
        return;
      }

      if (!force && lastFetchedTokenRef.current === token && license) {
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const lic = await getMyLicense(token);
        setLicense(lic);
        setIsExpired(Boolean(lic?.isExpired));
        lastFetchedTokenRef.current = token;
      } catch {
        setLicense(null);
        setIsExpired(false);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token, isAuthenticated, license],
  );

  useEffect(() => {
    fetchLicense();
  }, [fetchLicense]);

  return {
    license,
    isLoading,
    isExpired,
    aiCredits: license?.aiCredits ?? 0,
    canCloudBackup: Boolean(license?.canCloudBackup),
    refreshLicense: () => fetchLicense(true),
  };
}
