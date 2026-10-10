'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { LicensesTable } from '@/components/plans/LicensesTable';

export default function LicensesPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [licenses, setLicenses] = useState<AdminLicenseItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const licensesData = await api.getAdminLicenses().catch(() => []);
      setLicenses(licensesData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося завантажити ліцензії';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  return (
    <div
      data-testid="licenses-page"
      className="flex flex-col space-y-4 animate-in fade-in duration-300 flex-1 min-h-[calc(100vh-8rem)]"
    >
      {error && (
        <div
          data-testid="licenses-error-alert"
          className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20"
        >
          {error}
        </div>
      )}

      {/* Active Issued Licenses Table */}
      <LicensesTable
        licenses={licenses}
        isUk={isUk}
        onRefresh={fetchLicenses}
        isLoading={isLoading}
      />
    </div>
  );
}
