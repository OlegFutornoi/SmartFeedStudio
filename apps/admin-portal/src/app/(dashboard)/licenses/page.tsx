'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Layers } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  TariffPlanDto,
  CreateTariffPlanDto,
  UpdateTariffPlanDto,
  AdminLicenseItemDto,
} from '@smartfeed/shared';
import { PlanCard } from '../../../components/plans/PlanCard';
import { PlanDialog } from '../../../components/plans/PlanDialog';
import { LicensesTable } from '../../../components/plans/LicensesTable';

export default function LicensesPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [plans, setPlans] = useState<TariffPlanDto[]>([]);
  const [licenses, setLicenses] = useState<AdminLicenseItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TariffPlanDto | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansData, licensesData] = await Promise.all([
        api.getAdminTariffPlans().catch(() => api.getTariffPlans()),
        api.getAdminLicenses().catch(() => []),
      ]);
      setPlans(plansData);
      setLicenses(licensesData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося завантажити дані тарифів';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (plan: TariffPlanDto) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleDeletePlan = async (id: string, code: string) => {
    if (
      !confirm(
        isUk
          ? `Ви впевнені, що хочете видалити тарифний план "${code}"?`
          : `Are you sure you want to delete tariff plan "${code}"?`,
      )
    ) {
      return;
    }

    try {
      await api.deleteTariffPlan(id);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка видалення тарифного плану';
      alert(msg);
    }
  };

  const handleSavePlan = async (
    dto: CreateTariffPlanDto | UpdateTariffPlanDto,
    isEdit: boolean,
  ) => {
    if (isEdit && editingPlan) {
      await api.updateTariffPlan(editingPlan.id, dto as UpdateTariffPlanDto);
    } else {
      await api.createTariffPlan(dto as CreateTariffPlanDto);
    }
    await fetchData();
  };

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
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            {isUk ? 'Тарифні плани та ліцензії' : 'Tariff Plans & Licenses'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isUk
              ? 'Керування квотами, ціноутворенням та активними ліцензіями користувачів'
              : 'Manage dynamic tariff quotas, pricing tiers, and issued customer licenses'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            data-testid="refresh-plans-btn"
            onClick={fetchData}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title={isUk ? 'Оновити' : 'Refresh'}
            aria-label={isUk ? 'Оновити' : 'Refresh'}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            data-testid="create-plan-btn"
            onClick={handleOpenCreate}
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>{isUk ? 'Створити тариф' : 'New Plan Tier'}</span>
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

      {/* Plans Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          <h2
            data-testid="active-plans-section-title"
            className="text-base font-semibold text-foreground"
          >
            {isUk ? 'Доступні тарифні плани' : 'Active Tariff Plans'}
          </h2>
        </div>

        {isLoading && plans.length === 0 ? (
          <div
            data-testid="plans-loading-skeleton"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl border border-border bg-card/40 animate-pulse"
              />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div
            data-testid="plans-empty-state"
            className="p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs"
          >
            {isUk
              ? 'Тарифні плани не знайдено. Створіть перший план через кнопку вище.'
              : 'No tariff plans found. Create your first plan above.'}
          </div>
        ) : (
          <div data-testid="plans-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isUk={isUk}
                onEdit={handleOpenEdit}
                onDelete={handleDeletePlan}
              />
            ))}
          </div>
        )}
      </div>

      {/* Active Issued Licenses Table */}
      <LicensesTable licenses={licenses} isUk={isUk} />

      {/* Plan Create/Edit Dialog */}
      <PlanDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSavePlan}
        initialData={editingPlan}
        isUk={isUk}
      />
    </div>
  );
}
