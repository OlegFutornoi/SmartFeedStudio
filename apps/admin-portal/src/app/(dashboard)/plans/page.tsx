'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Layers, KeyRound } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { api } from '../../../lib/api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TariffPlanDto, CreateTariffPlanDto, UpdateTariffPlanDto } from '@smartfeed/shared';
import { PlanCard } from '../../../components/plans/PlanCard';
import { PlanDialog } from '../../../components/plans/PlanDialog';
import { PlanDeleteDialog } from '../../../components/plans/PlanDeleteDialog';

export default function PlansPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [plans, setPlans] = useState<TariffPlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/Create dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TariffPlanDto | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const plansData = await api.getAdminTariffPlans().catch(() => api.getTariffPlans());
      setPlans(plansData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося завантажити тарифні плани';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleOpenCreate = useCallback(() => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((plan: TariffPlanDto) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  }, []);

  const handleRequestDelete = useCallback((id: string, code: string) => {
    setDeleteTarget({ id, code });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteTariffPlan(deleteTarget.id);
      setDeleteTarget(null);
      await fetchPlans();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : isUk
            ? 'Помилка видалення тарифного плану'
            : 'Failed to delete tariff plan';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, fetchPlans, isUk]);

  const handleSavePlan = useCallback(
    async (dto: CreateTariffPlanDto | UpdateTariffPlanDto, isEdit: boolean) => {
      if (isEdit && editingPlan) {
        await api.updateTariffPlan(editingPlan.id, dto as UpdateTariffPlanDto);
      } else {
        await api.createTariffPlan(dto as CreateTariffPlanDto);
      }
      await fetchPlans();
    },
    [editingPlan, fetchPlans],
  );

  return (
    <div
      data-testid="plans-management-page"
      className="flex flex-col space-y-6 animate-in fade-in duration-300"
    >
      {/* Sleek Minimalist Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            data-testid="plans-header-title"
            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5"
          >
            <Layers className="size-6 text-primary shrink-0" />
            <span>{isUk ? 'Тарифні плани' : 'Tariff Plans'}</span>
          </h1>
          <p data-testid="plans-header-subtitle" className="text-sm text-muted-foreground mt-0.5">
            {isUk
              ? 'Керування квотами, ціноутворенням, кількістю постачальників та перевагами планів'
              : 'Manage dynamic quotas, pricing tiers, suppliers limits, and plan features'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/licenses"
            data-testid="go-to-licenses-btn"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors border border-border bg-transparent hover:bg-secondary text-foreground h-8 px-3 text-xs gap-1.5"
          >
            <KeyRound className="size-3.5 text-primary" />
            <span>{isUk ? 'Ліцензії' : 'Licenses'}</span>
          </Link>
          <Button
            variant="outline"
            size="sm"
            data-testid="refresh-plans-btn"
            onClick={fetchPlans}
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
          data-testid="plans-error-alert"
          className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20"
        >
          {error}
        </div>
      )}

      {/* Plans Section */}
      <div className="flex flex-col gap-4">
        {isLoading && plans.length === 0 ? (
          <div
            data-testid="plans-loading-skeleton"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
                onDelete={handleRequestDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Plan Create/Edit Dialog */}
      <PlanDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleSavePlan}
        initialData={editingPlan}
        isUk={isUk}
      />

      {/* Plan Delete Confirmation Dialog */}
      <PlanDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        planCode={deleteTarget?.code ?? null}
        isUk={isUk}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
