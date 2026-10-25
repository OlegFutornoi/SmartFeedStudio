import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SupplierDto,
  SupplierSyncSettingDto,
  SupplierSyncLogDto,
  UpdateSupplierSyncSettingDto,
} from '@smartfeed/shared';
import {
  getSupplierSyncSettings,
  updateSupplierSyncSettings,
  getSupplierSyncLogs,
  syncSupplierFeed,
  clearSupplierSyncLogs,
} from '@/lib/api/supplier-sync';
import { useAuth } from '@/contexts/AuthContext';
import { SupplierSyncStatusBanner } from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncStatusBanner';
import { SupplierSyncFieldsCard } from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncFieldsCard';
import { SupplierSyncPricingCard } from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncPricingCard';
import { SupplierSyncAssortmentCard } from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncAssortmentCard';
import { SupplierSyncScheduleCard } from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncScheduleCard';
import { SupplierSyncHistoryTable } from '@/modules/suppliers/components/drawer/tabs/sync/SupplierSyncHistoryTable';
import { useTranslation } from '@/i18n';

interface SupplierSyncTabProps {
  supplier: SupplierDto;
  onRefreshSupplier?: () => void;
}

export const SupplierSyncTab: React.FC<SupplierSyncTabProps> = ({
  supplier,
  onRefreshSupplier,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const { token } = useAuth();
  const [settings, setSettings] = useState<SupplierSyncSettingDto | null>(null);
  const [logs, setLogs] = useState<SupplierSyncLogDto[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  const loadData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [fetchedSettings, fetchedLogs] = await Promise.all([
        getSupplierSyncSettings(supplier.id, token || undefined),
        getSupplierSyncLogs(supplier.id, token || undefined),
      ]);
      setSettings(fetchedSettings);
      setLogs(fetchedLogs);
    } catch (err) {
      console.warn('[SupplierSyncTab] Failed to load sync data:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [supplier.id, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateSettings = async (patch: UpdateSupplierSyncSettingDto) => {
    if (!settings) return;
    try {
      // Optimistic update
      setSettings((prev) => (prev ? { ...prev, ...patch } : null));
      const updated = await updateSupplierSyncSettings(supplier.id, patch, token || undefined);
      setSettings(updated);
    } catch (err) {
      console.warn('[SupplierSyncTab] Failed to update settings:', err);
      loadData();
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await syncSupplierFeed(supplier.id, {}, token || undefined);
      await loadData();
      onRefreshSupplier?.();
    } catch (err) {
      console.warn('[SupplierSyncTab] Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await clearSupplierSyncLogs(supplier.id, token || undefined);
      setLogs([]);
    } catch (err) {
      console.warn('[SupplierSyncTab] Clear logs error:', err);
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
        {t('suppliers:loadingSyncSettings', {
          defaultValue: 'Завантаження налаштувань синхронізації...',
        })}
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-4 p-5" data-testid="supplier-sync-tab">
      {/* 1. Header Status & Trigger Banner */}
      <SupplierSyncStatusBanner
        settings={settings}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
      />

      {/* 2. Content & Granular Field Protection */}
      <SupplierSyncFieldsCard settings={settings} onChange={handleUpdateSettings} />

      {/* 3. Pricing and Margin Rules */}
      <SupplierSyncPricingCard settings={settings} onChange={handleUpdateSettings} />

      {/* 4. Assortment and Missing Products Rules */}
      <SupplierSyncAssortmentCard settings={settings} onChange={handleUpdateSettings} />

      {/* 5. Schedule & Background Automation */}
      <SupplierSyncScheduleCard settings={settings} onChange={handleUpdateSettings} />

      {/* 6. Execution Audit History Table */}
      <SupplierSyncHistoryTable logs={logs} onClearLogs={handleClearLogs} isClearing={isClearing} />
    </div>
  );
};
