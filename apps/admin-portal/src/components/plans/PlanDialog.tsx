'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { TariffPlanDto, CreateTariffPlanDto, UpdateTariffPlanDto } from '@smartfeed/shared';
import { Layers, Info, Sliders, ShieldCheck, ListPlus } from 'lucide-react';
import { PlanFeatureList } from './PlanFeatureList';
import { usePlanForm } from './usePlanForm';
import { PlanDialogBasicTab } from './PlanDialogBasicTab';
import { PlanDialogQuotasTab } from './PlanDialogQuotasTab';
import { PlanDialogFlagsTab } from './PlanDialogFlagsTab';

interface PlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTariffPlanDto | UpdateTariffPlanDto, isEdit: boolean) => Promise<void>;
  initialData?: TariffPlanDto | null;
  isUk: boolean;
}

type DialogTab = 'basic' | 'quotas' | 'flags' | 'features';

interface TabConfig {
  key: DialogTab;
  testId: string;
  icon: React.ElementType;
  labelUk: string;
  labelEn: string;
}

const TABS: TabConfig[] = [
  {
    key: 'basic',
    testId: 'plan-dialog-tab-basic',
    icon: Info,
    labelUk: 'Основне',
    labelEn: 'Basic Info',
  },
  {
    key: 'quotas',
    testId: 'plan-dialog-tab-quotas',
    icon: Sliders,
    labelUk: 'Квоти & Ліміти',
    labelEn: 'Quotas & Limits',
  },
  {
    key: 'flags',
    testId: 'plan-dialog-tab-flags',
    icon: ShieldCheck,
    labelUk: 'Прапорці доступу',
    labelEn: 'Feature Flags',
  },
  {
    key: 'features',
    testId: 'plan-dialog-tab-features',
    icon: ListPlus,
    labelUk: 'Список переваг',
    labelEn: 'Bullet List',
  },
];

export function PlanDialog({ isOpen, onClose, onSubmit, initialData, isUk }: PlanDialogProps) {
  const [activeTab, setActiveTab] = useState<DialogTab>('basic');

  const form = usePlanForm({ initialData, isOpen, onSubmit, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="plan-dialog"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <DialogTitle data-testid="plan-dialog-title" className="text-base font-semibold">
              {form.isEdit
                ? isUk
                  ? 'Редагувати тарифний план'
                  : 'Edit Tariff Plan'
                : isUk
                  ? 'Створити новий тарифний план'
                  : 'Create Tariff Plan'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {isUk
              ? 'Налаштуйте параметри квот, ціноутворення та списки можливостей тарифу'
              : 'Configure quotas, pricing, and features for this plan tier'}
          </DialogDescription>

          {/* Dialog Navigation Tabs */}
          <div className="flex border-b border-border/80 pt-2 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                data-testid={tab.testId}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="size-3.5" />
                <span>{isUk ? tab.labelUk : tab.labelEn}</span>
              </button>
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit} className="flex flex-col gap-4 py-2">
          {form.error && (
            <div
              data-testid="plan-dialog-error"
              className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20"
            >
              {form.error}
            </div>
          )}

          {activeTab === 'basic' && (
            <PlanDialogBasicTab
              isUk={isUk}
              isEdit={form.isEdit}
              code={form.code}
              setCode={form.setCode}
              nameUk={form.nameUk}
              setNameUk={form.setNameUk}
              nameEn={form.nameEn}
              setNameEn={form.setNameEn}
              descriptionUk={form.descriptionUk}
              setDescriptionUk={form.setDescriptionUk}
              descriptionEn={form.descriptionEn}
              setDescriptionEn={form.setDescriptionEn}
              priceMonthly={form.priceMonthly}
              setPriceMonthly={form.setPriceMonthly}
              priceYearly={form.priceYearly}
              setPriceYearly={form.setPriceYearly}
              currency={form.currency}
              setCurrency={form.setCurrency}
              order={form.order}
              setOrder={form.setOrder}
              isPopular={form.isPopular}
              setIsPopular={form.setIsPopular}
              isActive={form.isActive}
              setIsActive={form.setIsActive}
            />
          )}

          {activeTab === 'quotas' && (
            <PlanDialogQuotasTab
              isUk={isUk}
              maxXmlLimit={form.maxXmlLimit}
              setMaxXmlLimit={form.setMaxXmlLimit}
              maxSuppliersLimit={form.maxSuppliersLimit}
              setMaxSuppliersLimit={form.setMaxSuppliersLimit}
              maxFeedsLimit={form.maxFeedsLimit}
              setMaxFeedsLimit={form.setMaxFeedsLimit}
              maxChannelsLimit={form.maxChannelsLimit}
              setMaxChannelsLimit={form.setMaxChannelsLimit}
              maxTeamSeats={form.maxTeamSeats}
              setMaxTeamSeats={form.setMaxTeamSeats}
              maxStorageGb={form.maxStorageGb}
              setMaxStorageGb={form.setMaxStorageGb}
              aiCredits={form.aiCredits}
              setAiCredits={form.setAiCredits}
              syncFrequencyHours={form.syncFrequencyHours}
              setSyncFrequencyHours={form.setSyncFrequencyHours}
            />
          )}

          {activeTab === 'flags' && (
            <PlanDialogFlagsTab
              isUk={isUk}
              canCloudBackup={form.canCloudBackup}
              setCanCloudBackup={form.setCanCloudBackup}
              hasApiAccess={form.hasApiAccess}
              setHasApiAccess={form.setHasApiAccess}
              hasFeedDiff={form.hasFeedDiff}
              setHasFeedDiff={form.setHasFeedDiff}
              hasWebhooks={form.hasWebhooks}
              setHasWebhooks={form.setHasWebhooks}
              hasCustomS3={form.hasCustomS3}
              setHasCustomS3={form.setHasCustomS3}
              hasAuditLog={form.hasAuditLog}
              setHasAuditLog={form.setHasAuditLog}
              hasWhiteLabel={form.hasWhiteLabel}
              setHasWhiteLabel={form.setHasWhiteLabel}
              hasPriorityAi={form.hasPriorityAi}
              setHasPriorityAi={form.setHasPriorityAi}
              slaUptimePercent={form.slaUptimePercent}
              setSlaUptimePercent={form.setSlaUptimePercent}
            />
          )}

          {activeTab === 'features' && (
            <PlanFeatureList
              featuresUk={form.featuresUk}
              featuresEn={form.featuresEn}
              newFeatureUk={form.newFeatureUk}
              newFeatureEn={form.newFeatureEn}
              onNewFeatureUkChange={form.setNewFeatureUk}
              onNewFeatureEnChange={form.setNewFeatureEn}
              onAddFeature={form.handleAddFeature}
              onUpdateFeature={form.handleUpdateFeature}
              onRemoveFeature={form.handleRemoveFeature}
              isUk={isUk}
            />
          )}

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="plan-cancel-btn"
              onClick={onClose}
              className="h-8 text-xs"
            >
              {isUk ? 'Скасувати' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              size="sm"
              data-testid="plan-submit-btn"
              disabled={form.isSubmitting}
              className="h-8 text-xs"
            >
              {form.isSubmitting
                ? isUk
                  ? 'Збереження...'
                  : 'Saving...'
                : form.isEdit
                  ? isUk
                    ? 'Оновити план'
                    : 'Update Plan'
                  : isUk
                    ? 'Створити план'
                    : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
