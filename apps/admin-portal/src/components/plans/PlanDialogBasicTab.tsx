import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PlanDialogBasicTabProps {
  isUk: boolean;
  isEdit: boolean;
  code: string;
  setCode: (v: string) => void;
  nameUk: string;
  setNameUk: (v: string) => void;
  nameEn: string;
  setNameEn: (v: string) => void;
  descriptionUk: string;
  setDescriptionUk: (v: string) => void;
  descriptionEn: string;
  setDescriptionEn: (v: string) => void;
  priceMonthly: string;
  setPriceMonthly: (v: string) => void;
  priceYearly: string;
  setPriceYearly: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => void;
  order: string;
  setOrder: (v: string) => void;
  isPopular: boolean;
  setIsPopular: (v: boolean) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
}

export function PlanDialogBasicTab({
  isUk,
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
  order,
  setOrder,
  isPopular,
  setIsPopular,
  isActive,
  setIsActive,
}: PlanDialogBasicTabProps) {
  return (
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
          <span>{isUk ? 'Популярний тариф (Хіт продажу)' : 'Popular Tier (Best Seller)'}</span>
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
  );
}
