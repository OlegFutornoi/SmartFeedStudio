'use client';

import React from 'react';
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
import { Layers } from 'lucide-react';
import { PlanFeatureList } from './PlanFeatureList';
import { usePlanForm } from './usePlanForm';

interface PlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTariffPlanDto | UpdateTariffPlanDto, isEdit: boolean) => Promise<void>;
  initialData?: TariffPlanDto | null;
  isUk: boolean;
}

export function PlanDialog({ isOpen, onClose, onSubmit, initialData, isUk }: PlanDialogProps) {
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
    maxXmlLimit,
    setMaxXmlLimit,
    aiCredits,
    setAiCredits,
    canCloudBackup,
    setCanCloudBackup,
    isPopular,
    setIsPopular,
    featuresUk,
    featuresEn,
    newFeatureUk,
    setNewFeatureUk,
    newFeatureEn,
    setNewFeatureEn,
    isSubmitting,
    error,
    handleAddFeature,
    handleRemoveFeature,
    handleSubmit,
  } = usePlanForm({ initialData, isOpen, onSubmit, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="plan-dialog" className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
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

          {/* Code & Popular */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{isUk ? 'Код плану (ID)' : 'Plan Code'}</Label>
              <Input
                data-testid="plan-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PRO_PLUS"
                disabled={isEdit}
                required
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="plan-is-popular-checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Популярний план' : 'Is Popular'}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="plan-cloud-backup-checkbox"
                  checked={canCloudBackup}
                  onChange={(e) => setCanCloudBackup(e.target.checked)}
                  className="rounded border-border"
                />
                <span>{isUk ? 'Cloud Backup' : 'Cloud Backup'}</span>
              </label>
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

          {/* Pricing & Quotas */}
          <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{isUk ? 'Ціна/міс ($)' : 'Price/mo ($)'}</Label>
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
              <Label className="text-xs">{isUk ? 'Ціна/рік ($)' : 'Price/yr ($)'}</Label>
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
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{isUk ? 'XML Ліміт' : 'XML Limit'}</Label>
              <Input
                type="number"
                min="1"
                step="any"
                data-testid="plan-max-xml-input"
                value={maxXmlLimit}
                onChange={(e) => setMaxXmlLimit(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{isUk ? 'AI Кредити' : 'AI Credits'}</Label>
              <Input
                type="number"
                min="0"
                step="any"
                data-testid="plan-ai-credits-input"
                value={aiCredits}
                onChange={(e) => setAiCredits(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Dynamic Feature Bullets Component */}
          <PlanFeatureList
            featuresUk={featuresUk}
            featuresEn={featuresEn}
            newFeatureUk={newFeatureUk}
            newFeatureEn={newFeatureEn}
            onNewFeatureUkChange={setNewFeatureUk}
            onNewFeatureEnChange={setNewFeatureEn}
            onAddFeature={handleAddFeature}
            onRemoveFeature={handleRemoveFeature}
            isUk={isUk}
          />

          <DialogFooter className="pt-3 border-t border-border">
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
