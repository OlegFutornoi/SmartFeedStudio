'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { KeyRound, Layers } from 'lucide-react';
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
      {/* Sleek Minimalist Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            data-testid="licenses-header-title"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5"
          >
            <KeyRound className="size-6 text-primary shrink-0" />
            <span>{isUk ? 'Видані ліцензії' : 'Issued Customer Licenses'}</span>
          </h1>
          <p
            data-testid="licenses-header-subtitle"
            className="text-sm text-muted-foreground mt-0.5"
          >
            {isUk
              ? 'Моніторинг активних підписок, квот, термінів дії та тарифів зареєстрованих клієнтів'
              : 'Monitor active customer subscriptions, quotas, validity periods, and assigned plan tiers'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/plans"
            data-testid="go-to-plans-btn"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors border border-border bg-transparent hover:bg-secondary text-foreground h-8 px-3 text-xs gap-1.5"
          >
            <Layers className="size-3.5 text-primary" />
            <span>{isUk ? 'Тарифи' : 'Tariff Plans'}</span>
          </Link>
        </div>
      </div>

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
