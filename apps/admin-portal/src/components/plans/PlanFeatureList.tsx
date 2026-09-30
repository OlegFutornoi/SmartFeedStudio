'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PlanFeatureListProps {
  featuresUk: string[];
  featuresEn: string[];
  newFeatureUk: string;
  newFeatureEn: string;
  onNewFeatureUkChange: (val: string) => void;
  onNewFeatureEnChange: (val: string) => void;
  onAddFeature: () => void;
  onUpdateFeature: (idx: number, ukText: string, enText: string) => void;
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
  onUpdateFeature,
  onRemoveFeature,
  isUk,
}: PlanFeatureListProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editUk, setEditUk] = useState('');
  const [editEn, setEditEn] = useState('');

  const handleStartEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditUk(featuresUk[idx] || '');
    setEditEn(featuresEn[idx] || '');
  };

  const handleSaveEdit = (idx: number) => {
    if (editUk.trim() || editEn.trim()) {
      onUpdateFeature(idx, editUk.trim() || editEn.trim(), editEn.trim() || editUk.trim());
    }
    setEditingIdx(null);
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
  };

  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-border/60">
      <Label className="text-xs font-semibold">
        {isUk ? 'Пункти можливостей тарифу (Features)' : 'Plan Feature Bullets'}
      </Label>

      {/* Add New Feature Row */}
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
          className="h-8 px-2.5 text-xs gap-1 shrink-0"
        >
          <Plus className="size-3" />
          <span>{isUk ? 'Додати' : 'Add'}</span>
        </Button>
      </div>

      {/* Existing Features List */}
      {featuresUk.length > 0 && (
        <div
          data-testid="plan-features-preview-list"
          className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pt-1 pr-0.5"
        >
          {featuresUk.map((fUk, idx) => {
            const isEditing = editingIdx === idx;
            const fEn = featuresEn[idx] || '';

            if (isEditing) {
              return (
                <div
                  key={idx}
                  data-testid={`plan-feature-edit-row-${idx}`}
                  className="flex items-center gap-1.5 p-1.5 rounded-md bg-secondary/50 border border-primary/40"
                >
                  <Input
                    value={editUk}
                    onChange={(e) => setEditUk(e.target.value)}
                    placeholder="UA"
                    data-testid={`plan-feature-edit-uk-${idx}`}
                    className="h-7 text-xs flex-1 bg-background"
                  />
                  <Input
                    value={editEn}
                    onChange={(e) => setEditEn(e.target.value)}
                    placeholder="EN"
                    data-testid={`plan-feature-edit-en-${idx}`}
                    className="h-7 text-xs flex-1 bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    data-testid={`plan-feature-save-btn-${idx}`}
                    onClick={() => handleSaveEdit(idx)}
                    className="h-7 w-7 p-0 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                    title={isUk ? 'Зберегти' : 'Save'}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    data-testid={`plan-feature-cancel-btn-${idx}`}
                    onClick={handleCancelEdit}
                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                    title={isUk ? 'Скасувати' : 'Cancel'}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              );
            }

            return (
              <div
                key={idx}
                data-testid={`plan-feature-row-${idx}`}
                className="group flex items-center justify-between p-2 rounded-md bg-secondary/30 text-xs border border-border/40 hover:border-border transition-colors"
              >
                <div className="flex flex-col gap-0.5 truncate pr-2">
                  <span className="truncate text-foreground font-medium">
                    <span className="text-[10px] text-muted-foreground uppercase font-mono mr-1.5">
                      UA:
                    </span>
                    {fUk}
                  </span>
                  {fEn && (
                    <span className="truncate text-muted-foreground text-[11px]">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono mr-1.5">
                        EN:
                      </span>
                      {fEn}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    data-testid={`plan-feature-edit-btn-${idx}`}
                    onClick={() => handleStartEdit(idx)}
                    className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-secondary transition-colors"
                    title={isUk ? 'Редагувати' : 'Edit'}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    data-testid={`plan-feature-remove-btn-${idx}`}
                    onClick={() => onRemoveFeature(idx)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-secondary transition-colors"
                    title={isUk ? 'Видалити' : 'Delete'}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
