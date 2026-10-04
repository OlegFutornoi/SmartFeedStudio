import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyLicense } from '@/lib/api';
import type { LicenseEntity } from '@smartfeed/shared';

interface LicenseContextType {
  license: LicenseEntity | null;
  isLoading: boolean;
  isExpired: boolean;
  hasNoLicense: boolean;
  daysRemaining: number;
  aiCredits: number;
  canCloudBackup: boolean;
  refreshLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, user } = useAuth();
  const [license, setLicense] = useState<LicenseEntity | null>(() => {
    try {
      const saved = localStorage.getItem('smartfeed_license');
      return saved ? (JSON.parse(saved) as LicenseEntity) : null;
    } catch (err) {
      console.warn('[LicenseContext] Failed to parse cached license from localStorage:', err);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const licenseRef = useRef(license);
  licenseRef.current = license;

  const fetchLicense = useCallback(
    async (force = false) => {
      if (!token || !isAuthenticated) {
        setLicense(null);
        setIsExpired(false);
        setIsLoading(false);
        return;
      }

      if (isAdmin) {
        setIsExpired(false);
        setIsLoading(false);
      }

      if (!force && lastFetchedTokenRef.current === token && licenseRef.current) {
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const lic = await getMyLicense(token);
        setLicense(lic);
        if (lic) {
          localStorage.setItem('smartfeed_license', JSON.stringify(lic));
        }
        const expired = isAdmin ? false : Boolean(!lic || !lic.isActive || lic.isExpired);
        setIsExpired(expired);
        lastFetchedTokenRef.current = token;
      } catch (err) {
        console.warn('[LicenseContext:fetchLicense] Failed to fetch license:', err);
        if (isAdmin) {
          setIsExpired(false);
        } else if (token.startsWith('mock-')) {
          setIsExpired(false);
        } else {
          setLicense(null);
          setIsExpired(true);
        }
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token, isAuthenticated, isAdmin],
  );

  useEffect(() => {
    fetchLicense();
  }, [fetchLicense]);

  const value = useMemo(
    () => ({
      license,
      isLoading,
      isExpired: isAdmin ? false : isExpired,
      hasNoLicense: isAdmin ? false : !license,
      daysRemaining: license?.daysRemaining ?? (isAdmin ? 365 : 0),
      aiCredits: license?.aiCredits ?? (isAdmin ? 999999 : 0),
      canCloudBackup: isAdmin ? true : Boolean(license?.canCloudBackup),
      refreshLicense: () => fetchLicense(true),
    }),
    [license, isLoading, isExpired, isAdmin, fetchLicense],
  );

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense(): LicenseContextType {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}
