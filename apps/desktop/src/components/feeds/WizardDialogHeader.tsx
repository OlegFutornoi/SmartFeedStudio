import React from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { useTranslation } from '@/i18n';

export type WizardStep = 'SOURCE' | 'SUPPLIER' | 'PREVIEW' | 'PROGRESS';

interface WizardDialogHeaderProps {
  step: WizardStep;
  onClose: () => void;
}

const STEPS: Array<{
  id: WizardStep;
  shortKey: string;
  defaultShort: string;
}> = [
  { id: 'SOURCE', shortKey: 'suppliers:wizardStep1Short', defaultShort: 'Джерело' },
  { id: 'SUPPLIER', shortKey: 'suppliers:wizardStep2Short', defaultShort: 'Націнка' },
  { id: 'PREVIEW', shortKey: 'suppliers:wizardStep3Short', defaultShort: 'Категорії' },
  { id: 'PROGRESS', shortKey: 'suppliers:wizardStep4Short', defaultShort: 'Імпорт' },
];

export const WizardDialogHeader: React.FC<WizardDialogHeaderProps> = ({ step, onClose }) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const getStepSubtitle = () => {
    switch (step) {
      case 'SOURCE':
        return t('suppliers:wizardStep1Subtitle', {
          defaultValue: 'Крок 1 з 4: Джерело даних (URL або файл)',
        });
      case 'SUPPLIER':
        return t('suppliers:wizardStep2Subtitle', {
          defaultValue: 'Крок 2 з 4: Постачальник та правила націнки',
        });
      case 'PREVIEW':
        return t('suppliers:wizardStep3Subtitle', {
          defaultValue: 'Крок 3 з 4: Попередній перегляд та вибір категорій',
        });
      case 'PROGRESS':
        return t('suppliers:wizardStep4Subtitle', {
          defaultValue: 'Крок 4 з 4: Фонова черга обробки товарів',
        });
    }
  };

  const activeIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="px-5 py-3.5 border-b border-border/60 bg-card flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-8 rounded-md bg-muted border border-border/60 text-foreground flex items-center justify-center shrink-0">
          <Sparkles className="size-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight text-balance">
            {t('suppliers:importWizardTitle', { defaultValue: 'Майстер Імпорту Фідів' })}
          </h2>
          <p className="text-xs text-muted-foreground truncate">{getStepSubtitle()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* High-Density Stepper Bar */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/50 text-xs">
          {STEPS.map((s, i) => {
            const isCurrent = i === activeIndex;
            const isCompleted = i < activeIndex;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs font-medium transition-colors ${
                  isCurrent
                    ? 'bg-card text-foreground border border-border/60 shadow-2xs'
                    : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`size-4 rounded-sm flex items-center justify-center text-3xs font-mono tabular-nums ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : isCompleted
                        ? 'bg-success/15 text-success border border-success/30'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="size-2.5" /> : i + 1}
                </span>
                <span className="hidden md:inline">
                  {t(s.shortKey, { defaultValue: s.defaultShort })}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          data-testid="wizard-close-btn"
          aria-label={t('common:close', { defaultValue: 'Закрити' })}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};
