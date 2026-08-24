'use client';

import React, { useState, useEffect } from 'react';
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
import {
  TariffPlanDto,
  CreateTariffPlanDto,
  UpdateTariffPlanDto,
  CreateTariffPlanDtoSchema,
} from '@smartfeed/shared';
import { Layers } from 'lucide-react';
import { PlanFeatureList } from './PlanFeatureList';

interface PlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTariffPlanDto | UpdateTariffPlanDto, isEdit: boolean) => Promise<void>;
  initialData?: TariffPlanDto | null;
  isUk: boolean;
}

export function PlanDialog({ isOpen, onClose, onSubmit, initialData, isUk }: PlanDialogProps) {
  const isEdit = !!initialData;

  const [code, setCode] = useState('');
  const [nameUk, setNameUk] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionUk, setDescriptionUk] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('0');
  const [priceYearly, setPriceYearly] = useState('');
  const [maxXmlLimit, setMaxXmlLimit] = useState('1000');
  const [aiCredits, setAiCredits] = useState('50');
  const [canCloudBackup, setCanCloudBackup] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [featuresUk, setFeaturesUk] = useState<string[]>([]);
  const [featuresEn, setFeaturesEn] = useState<string[]>([]);

  const [newFeatureUk, setNewFeatureUk] = useState('');
  const [newFeatureEn, setNewFeatureEn] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setNameUk(initialData.nameUk);
      setNameEn(initialData.nameEn);
      setDescriptionUk(initialData.descriptionUk || '');
      setDescriptionEn(initialData.descriptionEn || '');
      setPriceMonthly(initialData.priceMonthly.toString());
      setPriceYearly(initialData.priceYearly ? initialData.priceYearly.toString() : '');
      setMaxXmlLimit(initialData.maxXmlLimit.toString());
      setAiCredits(initialData.aiCredits.toString());
      setCanCloudBackup(initialData.canCloudBackup);
      setIsPopular(initialData.isPopular);
      setFeaturesUk(initialData.featuresUk || []);
      setFeaturesEn(initialData.featuresEn || []);
    } else {
      setCode('');
      setNameUk('');
      setNameEn('');
      setDescriptionUk('');
      setDescriptionEn('');
      setPriceMonthly('0');
      setPriceYearly('');
      setMaxXmlLimit('1000');
      setAiCredits('50');
      setCanCloudBackup(false);
      setIsPopular(false);
      setFeaturesUk([]);
      setFeaturesEn([]);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleAddFeature = () => {
    if (newFeatureUk.trim()) {
      setFeaturesUk([...featuresUk, newFeatureUk.trim()]);
      setNewFeatureUk('');
    }
    if (newFeatureEn.trim()) {
      setFeaturesEn([...featuresEn, newFeatureEn.trim()]);
      setNewFeatureEn('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeaturesUk(featuresUk.filter((_, i) => i !== index));
    setFeaturesEn(featuresEn.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      code: code.trim().toUpperCase(),
      nameUk: nameUk.trim(),
      nameEn: nameEn.trim(),
      descriptionUk: descriptionUk.trim() || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      priceMonthly: parseFloat(priceMonthly) || 0,
      priceYearly: priceYearly.trim() ? parseFloat(priceYearly) : undefined,
      currency: 'USD',
      maxXmlLimit: parseInt(maxXmlLimit, 10) || 1000,
      aiCredits: parseInt(aiCredits, 10) || 0,
      canCloudBackup,
      isPopular,
      isActive: true,
      order: initialData?.order ?? 0,
      featuresUk,
      featuresEn,
    };

    let submitPayload: CreateTariffPlanDto | UpdateTariffPlanDto = payload;

    if (!isEdit) {
      const validation = CreateTariffPlanDtoSchema.safeParse(payload);
      if (!validation.success) {
        setError(validation.error.issues[0]?.message || 'Перевірте правильність заповнення полів');
        return;
      }
      submitPayload = validation.data;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(submitPayload, isEdit);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка збереження тарифного плану';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
