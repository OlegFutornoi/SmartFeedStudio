'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, KeyRound, Layers } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { LicensesTable } from '../../../components/plans/LicensesTable';

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
      const msg =
        err instanceof Error
          ? err.message
          : isUk
            ? 'Не вдалося завантажити ліцензії'
            : 'Failed to load licenses';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isUk]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  return (
    <div
      data-testid="licenses-page"
      className="flex flex-col gap-8 animate-in fade-in duration-300"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1
            data-testid="licenses-header-title"
            className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5"
          >
            <KeyRound className="size-6 text-primary" />
            <span>{isUk ? 'Видані ліцензії' : 'Issued Customer Licenses'}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isUk
              ? 'Моніторинг активних підписок, квот, термінів дії та тарифів зареєстрованих клієнтів'
              : 'Monitor active customer subscriptions, quotas, validity periods, and assigned plan tiers'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/plans"
            data-testid="go-to-plans-btn"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors border border-border bg-transparent hover:bg-secondary text-foreground h-8 px-3 text-xs gap-1.5"
          >
            <Layers className="size-3.5 text-primary" />
            <span>{isUk ? 'Тарифи' : 'Tariff Plans'}</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            data-testid="refresh-licenses-btn"
            onClick={fetchLicenses}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title={isUk ? 'Оновити' : 'Refresh'}
            aria-label={isUk ? 'Оновити' : 'Refresh'}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
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
      <LicensesTable licenses={licenses} isUk={isUk} />
    </div>
  );
}
