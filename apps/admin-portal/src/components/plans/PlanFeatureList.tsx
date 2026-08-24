'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface PlanFeatureListProps {
  featuresUk: string[];
  featuresEn: string[];
  newFeatureUk: string;
  newFeatureEn: string;
  onNewFeatureUkChange: (val: string) => void;
  onNewFeatureEnChange: (val: string) => void;
  onAddFeature: () => void;
  onRemoveFeature: (idx: number) => void;
  isUk: boolean;
}

export function PlanFeatureList({
  featuresUk,
  featuresEn,
  newFeatureUk,
  newFeatureEn,
  onNewFeatureUkChange,
  onNewFeatureEnChange,
  onAddFeature,
  onRemoveFeature,
  isUk,
}: PlanFeatureListProps) {
  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
      <Label className="text-xs font-semibold">
        {isUk ? 'Пункти можливостей тарифу (Features)' : 'Plan Feature Bullets'}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          data-testid="plan-feature-uk-input"
          value={newFeatureUk}
          onChange={(e) => onNewFeatureUkChange(e.target.value)}
          placeholder={isUk ? 'Пункт українською...' : 'Feature in UA...'}
          className="h-8 text-xs flex-1"
        />
        <Input
          data-testid="plan-feature-en-input"
          value={newFeatureEn}
          onChange={(e) => onNewFeatureEnChange(e.target.value)}
          placeholder={isUk ? 'Пункт англійською...' : 'Feature in EN...'}
          className="h-8 text-xs flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-testid="plan-add-feature-btn"
          onClick={onAddFeature}
          className="h-8 px-2.5 text-xs gap-1"
        >
          <Plus className="size-3" />
          <span>{isUk ? 'Додати' : 'Add'}</span>
        </Button>
      </div>

      {featuresUk.length > 0 && (
        <div
          data-testid="plan-features-preview-list"
          className="flex flex-col gap-1 max-h-32 overflow-y-auto pt-1"
        >
          {featuresUk.map((fUk, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-1.5 rounded-md bg-secondary/30 text-xs border border-border/40"
            >
              <span className="truncate">
                <strong>UA:</strong> {fUk} {featuresEn[idx] ? `| EN: ${featuresEn[idx]}` : ''}
              </span>
              <button
                type="button"
                onClick={() => onRemoveFeature(idx)}
                className="text-muted-foreground hover:text-destructive p-1"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
