import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PlanDialogQuotasTabProps {
  isUk: boolean;
  maxXmlLimit: string;
  setMaxXmlLimit: (v: string) => void;
  maxSuppliersLimit: string;
  setMaxSuppliersLimit: (v: string) => void;
  maxFeedsLimit: string;
  setMaxFeedsLimit: (v: string) => void;
  maxChannelsLimit: string;
  setMaxChannelsLimit: (v: string) => void;
  maxTeamSeats: string;
  setMaxTeamSeats: (v: string) => void;
  maxStorageGb: string;
  setMaxStorageGb: (v: string) => void;
  aiCredits: string;
  setAiCredits: (v: string) => void;
  syncFrequencyHours: string;
  setSyncFrequencyHours: (v: string) => void;
}

export function PlanDialogQuotasTab({
  isUk,
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
}: PlanDialogQuotasTabProps) {
  return (
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
          <Label className="text-xs">{isUk ? 'Кількість постачальників' : 'Suppliers Limit'}</Label>
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
          <Label className="text-xs">{isUk ? 'Хмарне сховище S3 (GB)' : 'S3 Storage (GB)'}</Label>
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
          <Label className="text-xs">{isUk ? 'AI Кредити на місяць' : 'AI Credits / mo'}</Label>
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
            {isUk ? 'Частота авто-оновлення (годин, 0=вручну)' : 'Sync Frequency (hours, 0=manual)'}
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
  );
}
