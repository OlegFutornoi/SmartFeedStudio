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
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TariffPlanDto, CreateTariffPlanDto, UpdateTariffPlanDto } from '@smartfeed/shared';
import { Layers, Info, Sliders, ShieldCheck, ListPlus } from 'lucide-react';
import { PlanFeatureList } from './PlanFeatureList';
import { usePlanForm } from './usePlanForm';

interface PlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTariffPlanDto | UpdateTariffPlanDto, isEdit: boolean) => Promise<void>;
  initialData?: TariffPlanDto | null;
  isUk: boolean;
}

type DialogTab = 'basic' | 'quotas' | 'flags' | 'features';

export function PlanDialog({ isOpen, onClose, onSubmit, initialData, isUk }: PlanDialogProps) {
  const [activeTab, setActiveTab] = useState<DialogTab>('basic');

  const {
    isEdit,
    code,
    setCode,
    nameUk,
    setNameUk,
    nameEn,
    setNameEn,
    descriptionUk,
    setDescriptionUk,
    descriptionEn,
    setDescriptionEn,
    priceMonthly,
    setPriceMonthly,
    priceYearly,
    setPriceYearly,
    currency,
    setCurrency,
    isPopular,
    setIsPopular,
    isActive,
    setIsActive,
    order,
    setOrder,

    maxXmlLimit,
    setMaxXmlLimit,
    maxSuppliersLimit,
    setMaxSuppliersLimit,
    maxFeedsLimit,
    setMaxFeedsLimit,
    maxChannelsLimit,
    setMaxChannelsLimit,
    maxTeamSeats,
    setMaxTeamSeats,
    maxStorageGb,
    setMaxStorageGb,
    aiCredits,
    setAiCredits,
    syncFrequencyHours,
    setSyncFrequencyHours,

    canCloudBackup,
    setCanCloudBackup,
    hasApiAccess,
    setHasApiAccess,
    hasFeedDiff,
    setHasFeedDiff,
    hasWebhooks,
    setHasWebhooks,
    hasCustomS3,
    setHasCustomS3,
    hasAuditLog,
    setHasAuditLog,
    hasWhiteLabel,
    setHasWhiteLabel,
    hasPriorityAi,
    setHasPriorityAi,
    slaUptimePercent,
    setSlaUptimePercent,

    featuresUk,
    featuresEn,
    newFeatureUk,
    setNewFeatureUk,
    newFeatureEn,
    setNewFeatureEn,

    isSubmitting,
    error,
    handleAddFeature,
    handleUpdateFeature,
    handleRemoveFeature,
    handleSubmit,
  } = usePlanForm({ initialData, isOpen, onSubmit, onClose });

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
              {isEdit
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
            <button
              type="button"
              data-testid="plan-dialog-tab-basic"
              onClick={() => setActiveTab('basic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Info className="size-3.5" />
              <span>{isUk ? 'Основне' : 'Basic Info'}</span>
            </button>

            <button
              type="button"
              data-testid="plan-dialog-tab-quotas"
              onClick={() => setActiveTab('quotas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'quotas'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sliders className="size-3.5" />
              <span>{isUk ? 'Квоти & Ліміти' : 'Quotas & Limits'}</span>
            </button>

            <button
              type="button"
              data-testid="plan-dialog-tab-flags"
              onClick={() => setActiveTab('flags')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'flags'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>{isUk ? 'Прапорці доступу' : 'Feature Flags'}</span>
            </button>

            <button
              type="button"
              data-testid="plan-dialog-tab-features"
              onClick={() => setActiveTab('features')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'features'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListPlus className="size-3.5" />
              <span>{isUk ? 'Список переваг' : 'Bullet List'}</span>
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {error && (
            <div
              data-testid="plan-dialog-error"
              className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs border border-destructive/20"
            >
              {error}
            </div>
          )}

          {/* TAB 1: BASIC INFO & PRICING */}
          {activeTab === 'basic' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Код плану (ID)' : 'Plan Code'}</Label>
                  <Input
                    data-testid="plan-code-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="PRO"
                    disabled={isEdit}
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Валюта' : 'Currency'}</Label>
                  <Input
                    data-testid="plan-currency-input"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    placeholder="UAH"
                    required
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Порядок сортування' : 'Display Order'}</Label>
                  <Input
                    type="number"
                    data-testid="plan-order-input"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Назва (UA)' : 'Name (UA)'}</Label>
                  <Input
                    data-testid="plan-name-uk-input"
                    value={nameUk}
                    onChange={(e) => setNameUk(e.target.value)}
                    placeholder="Професійний"
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Назва (EN)' : 'Name (EN)'}</Label>
                  <Input
                    data-testid="plan-name-en-input"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Professional"
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Опис (UA)' : 'Description (UA)'}</Label>
                  <Input
                    data-testid="plan-desc-uk-input"
                    value={descriptionUk}
                    onChange={(e) => setDescriptionUk(e.target.value)}
                    placeholder="Для зростаючих магазинів"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Опис (EN)' : 'Description (EN)'}</Label>
                  <Input
                    data-testid="plan-desc-en-input"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="For growing e-commerce"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Ціна щомісячно (грн)' : 'Price/mo'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    data-testid="plan-price-monthly-input"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Ціна за рік (грн)' : 'Price/yr'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    data-testid="plan-price-yearly-input"
                    value={priceYearly}
                    onChange={(e) => setPriceYearly(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="plan-is-popular-checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>
                    {isUk ? 'Популярний тариф (Хіт продажу)' : 'Popular Tier (Best Seller)'}
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="plan-is-active-checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>{isUk ? 'Активний тариф' : 'Is Active'}</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: QUOTAS & LIMITS */}
          {activeTab === 'quotas' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    {isUk ? 'Кількість товарів (SKU)' : 'Product Limit (SKU)'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    data-testid="plan-max-xml-input"
                    value={maxXmlLimit}
                    onChange={(e) => setMaxXmlLimit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    {isUk ? 'Кількість постачальників' : 'Suppliers Limit'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    data-testid="plan-max-suppliers-input"
                    value={maxSuppliersLimit}
                    onChange={(e) => setMaxSuppliersLimit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    {isUk ? 'Вхідні файли/посилання (Feeds)' : 'Inbound Feeds Limit'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    data-testid="plan-max-feeds-input"
                    value={maxFeedsLimit}
                    onChange={(e) => setMaxFeedsLimit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    {isUk ? 'Канали вивантаження' : 'Export Channels Limit'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    data-testid="plan-max-channels-input"
                    value={maxChannelsLimit}
                    onChange={(e) => setMaxChannelsLimit(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">{isUk ? 'Місць у команді' : 'Team Seats'}</Label>
                  <Input
                    type="number"
                    min="1"
                    data-testid="plan-max-seats-input"
                    value={maxTeamSeats}
                    onChange={(e) => setMaxTeamSeats(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    {isUk ? 'Хмарне сховище S3 (GB)' : 'S3 Storage (GB)'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    data-testid="plan-max-storage-input"
                    value={maxStorageGb}
                    onChange={(e) => setMaxStorageGb(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    {isUk ? 'AI Кредити на місяць' : 'AI Credits / mo'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    data-testid="plan-ai-credits-input"
                    value={aiCredits}
                    onChange={(e) => setAiCredits(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">
                    {isUk
                      ? 'Частота авто-оновлення (годин, 0=вручну)'
                      : 'Sync Frequency (hours, 0=manual)'}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    data-testid="plan-sync-frequency-input"
                    value={syncFrequencyHours}
                    onChange={(e) => setSyncFrequencyHours(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FEATURE FLAGS */}
          {activeTab === 'flags' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-cloud-backup-checkbox"
                  checked={canCloudBackup}
                  onChange={(e) => setCanCloudBackup(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Хмарний бекап S3' : 'S3 Cloud Backup'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-api-access-checkbox"
                  checked={hasApiAccess}
                  onChange={(e) => setHasApiAccess(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'REST API доступ' : 'REST API Access'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-feed-diff-checkbox"
                  checked={hasFeedDiff}
                  onChange={(e) => setHasFeedDiff(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Порівняння версій (Diff)' : 'Feed Version Diff'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-webhooks-checkbox"
                  checked={hasWebhooks}
                  onChange={(e) => setHasWebhooks(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Webhooks сповіщення' : 'Webhook Notifications'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-custom-s3-checkbox"
                  checked={hasCustomS3}
                  onChange={(e) => setHasCustomS3(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Власний S3 (BYOS)' : 'Custom S3 Storage (BYOS)'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-audit-log-checkbox"
                  checked={hasAuditLog}
                  onChange={(e) => setHasAuditLog(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Журнал аудиту дій' : 'Team Audit Log'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-white-label-checkbox"
                  checked={hasWhiteLabel}
                  onChange={(e) => setHasWhiteLabel(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'White-label PDF звіти' : 'White-label Client Reports'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/20 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  data-testid="plan-priority-ai-checkbox"
                  checked={hasPriorityAi}
                  onChange={(e) => setHasPriorityAi(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Пріоритетна черга AI' : 'Priority AI Queue'}</span>
              </label>

              <div className="col-span-2 flex flex-col gap-1.5 pt-1">
                <Label className="text-xs">{isUk ? 'SLA Uptime (%)' : 'SLA Uptime (%)'}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  data-testid="plan-sla-uptime-input"
                  value={slaUptimePercent}
                  onChange={(e) => setSlaUptimePercent(e.target.value)}
                  placeholder="99.9"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 4: BULLET FEATURES */}
          {activeTab === 'features' && (
            <PlanFeatureList
              featuresUk={featuresUk}
              featuresEn={featuresEn}
              newFeatureUk={newFeatureUk}
              newFeatureEn={newFeatureEn}
              onNewFeatureUkChange={setNewFeatureUk}
              onNewFeatureEnChange={setNewFeatureEn}
              onAddFeature={handleAddFeature}
              onUpdateFeature={handleUpdateFeature}
              onRemoveFeature={handleRemoveFeature}
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
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              {isSubmitting
                ? isUk
                  ? 'Збереження...'
                  : 'Saving...'
                : isEdit
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
