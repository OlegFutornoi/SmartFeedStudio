'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Layers, KeyRound, LayoutGrid, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { TariffPlanDto, CreateTariffPlanDto, UpdateTariffPlanDto } from '@smartfeed/shared';
import { PlanCard } from '@/components/plans/PlanCard';
import { PlanComparisonTable } from '@/components/plans/PlanComparisonTable';
import { PlanDialog } from '@/components/plans/PlanDialog';
import { PlanDeleteDialog } from '@/components/plans/PlanDeleteDialog';

type ViewMode = 'cards' | 'comparison';

export default function PlansPage() {
  const { locale, t } = useLanguage();
  const isUk = locale === 'uk';

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [plans, setPlans] = useState<TariffPlanDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-flight deduplication ref
  const isFetchingRef = useRef<boolean>(false);

  // Edit/Create dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TariffPlanDto | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; code: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      const plansData = await api.getAdminTariffPlans();
      setPlans(plansData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не вдалося завантажити тарифні плани';
      setError(msg);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
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
            <span>{t('plans', 'title')}</span>
          </h1>
          <p data-testid="plans-header-subtitle" className="text-sm text-muted-foreground mt-0.5">
            {t('plans', 'subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Segmented View Switcher */}
          <div
            data-testid="plans-view-switcher"
            className="flex items-center p-0.5 rounded-lg border border-border bg-secondary/50"
          >
            <button
              type="button"
              data-testid="plans-view-cards-btn"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t('plans', 'cardsView')}
            >
              <LayoutGrid className="size-3.5" />
              <span>{t('plans', 'cardsView')}</span>
            </button>

            <button
              type="button"
              data-testid="plans-view-comparison-btn"
              onClick={() => setViewMode('comparison')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'comparison'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t('plans', 'comparisonView')}
            >
              <TableProperties className="size-3.5" />
              <span>{t('plans', 'comparisonView')}</span>
            </button>
          </div>

          <Link
            href="/licenses"
            data-testid="go-to-licenses-btn"
            className="inline-flex items-center justify-center rounded-md font-medium transition-colors border border-border bg-transparent hover:bg-secondary text-foreground h-8 px-3 text-xs gap-1.5"
          >
            <KeyRound className="size-3.5 text-primary" />
            <span>{t('navigation', 'licenses') || (isUk ? 'Ліцензії' : 'Licenses')}</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            data-testid="refresh-plans-btn"
            onClick={fetchPlans}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title={t('plans', 'refresh')}
            aria-label={t('plans', 'refresh')}
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
            <span>{t('plans', 'newPlan')}</span>
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

      {/* Main Content Area */}
      <div className="flex flex-col gap-4">
        {isLoading && plans.length === 0 ? (
          <div
            data-testid="plans-loading-skeleton"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-96 rounded-xl border border-border bg-card/40 animate-pulse"
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
        ) : viewMode === 'cards' ? (
          /* Cards View Grid (4 columns on lg screens) */
          <div
            data-testid="plans-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
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
        ) : (
          /* Feature Comparison Matrix View */
          <PlanComparisonTable plans={plans} isUk={isUk} onEdit={handleOpenEdit} />
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
