import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useTranslation } from '@/i18n';

export type WizardStep = 'SOURCE' | 'SUPPLIER' | 'PREVIEW' | 'PROGRESS';

interface WizardDialogHeaderProps {
  step: WizardStep;
  onClose: () => void;
}

const STEPS: WizardStep[] = ['SOURCE', 'SUPPLIER', 'PREVIEW', 'PROGRESS'];

export const WizardDialogHeader: React.FC<WizardDialogHeaderProps> = ({ step, onClose }) => {
  const { t } = useTranslation(['suppliers']);

  const getStepSubtitle = () => {
    switch (step) {
      case 'SOURCE':
        return 'Крок 1 з 4: Джерело даних (URL або файл)';
      case 'SUPPLIER':
        return 'Крок 2 з 4: Постачальник та правила націнки';
      case 'PREVIEW':
        return 'Крок 3 з 4: Попередній перегляд та вибір категорій';
      case 'PROGRESS':
        return 'Крок 4 з 4: Фонова черга обробки товарів';
    }
  };

  return (
    <div className="p-5 border-b border-border bg-card flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t('suppliers:importWizardTitle', { defaultValue: 'Майстер Імпорту Фідів' })}
          </h2>
          <p className="text-xs text-muted-foreground">{getStepSubtitle()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Step Indicators */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`size-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
                step === s
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : i < STEPS.indexOf(step)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};
