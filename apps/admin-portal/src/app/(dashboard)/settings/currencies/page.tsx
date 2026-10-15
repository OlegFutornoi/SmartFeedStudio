'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Landmark, ArrowLeft, RefreshCw, Sliders, CheckCircle2, Star, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { BankProviderConfigDto } from '@smartfeed/shared';
import { BankProviderEditDialog } from '@/components/currencies/BankProviderEditDialog';

export default function CurrenciesSettingsPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [providers, setProviders] = useState<BankProviderConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<BankProviderConfigDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchProviders = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      const data = await api.getBankProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to load bank providers', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncSuccess(null);
      const res = await api.syncCurrencyRates();
      if (res.synced) {
        setSyncSuccess(
          isUk ? 'Курси успішно оновлено та кешовано' : 'Rates synced and cached successfully',
        );
        await fetchProviders();
        setTimeout(() => setSyncSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Failed to sync rates', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickToggle = async (provider: BankProviderConfigDto, enabled: boolean) => {
    try {
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, isEnabled: enabled } : p)),
      );
      await api.updateBankProvider(provider.id, { isEnabled: enabled });
    } catch (err) {
      console.error('Failed to toggle provider', err);
      fetchProviders();
    }
  };

  const handleSaved = (updated: BankProviderConfigDto) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === updated.id) return updated;
        if (updated.isDefault) return { ...p, isDefault: false };
        return p;
      }),
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="size-8 p-0">
              <ArrowLeft className="size-4 text-muted-foreground" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                {isUk ? 'Курси валют & Банки' : 'Currency Rates & Bank Providers'}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isUk
                ? 'Керування банками України, маржею купівлі/продажу та синхронізацією курсів НБУ'
                : 'Configure Ukrainian banks, buy/sell spreads, and live NBU exchange rate synchronization'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncSuccess && (
            <Badge variant="outline" className="text-2xs gap-1 border-primary/30 text-primary">
              <CheckCircle2 className="size-3" />
              <span>{syncSuccess}</span>
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? isUk
                  ? 'Оновлення...'
                  : 'Syncing...'
                : isUk
                  ? 'Синхронізувати курси'
                  : 'Sync Rates'}
            </span>
          </Button>
        </div>
      </div>

      {/* Overview Info Banner */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                {isUk ? 'Мікросервісна архітектура курсів' : 'Currency Microservice Architecture'}
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-2xs font-mono">
              Redis TTL: 300s
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {isUk
              ? 'Курси автоматично підтягуються з офіційного API НБУ. Комерційні банки розраховують курс за налаштованими нижче відсотковими маржами без хардкоду.'
              : 'Rates are fetched dynamically from the official NBU API. Commercial bank spreads are calculated dynamically based on the configuration below.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Providers Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => {
            const isNbu = p.bankId === 'nbu';
            return (
              <Card
                key={p.id}
                className={`border-border/80 bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between transition-opacity ${
                  !p.isEnabled ? 'opacity-50' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {p.logoUrl ? (
                          <div className="size-5 rounded border border-border/50 bg-muted/40 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={p.logoUrl}
                              alt={p.bankName}
                              className="size-4 object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : null}
                        <Badge
                          variant="outline"
                          className="text-2xs font-mono uppercase bg-primary/10 text-primary border-primary/20"
                        >
                          {p.badge}
                        </Badge>
                        <CardTitle className="text-sm font-semibold">{p.bankName}</CardTitle>
                      </div>
                      {p.isDefault && (
                        <div className="flex items-center gap-1 text-2xs text-primary font-medium">
                          <Star className="size-2.5 fill-current" />
                          <span>{isUk ? 'Основний банк' : 'Default Bank'}</span>
                        </div>
                      )}
                    </div>

                    <Switch
                      checked={p.isEnabled}
                      onCheckedChange={(val) => handleQuickToggle(p, val)}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between text-2xs text-muted-foreground font-mono">
                    <span>{p.sourceType}</span>
                    {isNbu ? (
                      <span className="text-primary font-medium">
                        {isUk ? 'Базовий курс (0%)' : 'Base Rate (0%)'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 tabular-nums">
                        <span>
                          {isUk ? 'Прод' : 'Sell'}: +{p.sellSpreadPercent}%
                        </span>
                        <span>
                          {isUk ? 'Куп' : 'Buy'}: {p.buySpreadPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs gap-1.5"
                    onClick={() => {
                      setSelectedProvider(p);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Sliders className="size-3 text-muted-foreground" />
                    <span>{isUk ? 'Налаштувати маржу' : 'Configure Spreads'}</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BankProviderEditDialog
        provider={selectedProvider}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}
