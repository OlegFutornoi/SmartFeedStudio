import React from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { WizardStep } from './WizardDialogHeader';
import { FeedAnalysisResult } from '@/lib/api';

interface WizardDialogFooterProps {
  step: WizardStep;
  sourceType: 'URL' | 'FILE';
  feedUrl: string;
  fileContent: string | null;
  selectedSupplierId: string;
  hasSuppliers: boolean;
  isAnalyzing: boolean;
  isImporting: boolean;
  isFeedLimitReached: boolean;
  isQuotaExceeded: boolean;
  totalSelectedSkus: number;
  remainingQuota: number;
  analysis: FeedAnalysisResult | null;
  onClose: () => void;
  onBack: () => void;
  onNextFromSource: () => void;
  onNextFromSupplier: () => void;
  onStartImport: () => void;
}

export const WizardDialogFooter: React.FC<WizardDialogFooterProps> = ({
  step,
  sourceType,
  feedUrl,
  fileContent,
  selectedSupplierId,
  hasSuppliers,
  isAnalyzing,
  isImporting,
  isFeedLimitReached,
  isQuotaExceeded,
  totalSelectedSkus,
  remainingQuota,
  analysis: _analysis,
  onClose,
  onBack,
  onNextFromSource,
  onNextFromSupplier,
  onStartImport,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  if (step === 'PROGRESS') {
    return (
      <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-2 shrink-0">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Radio className="size-3.5 text-foreground animate-pulse" />
            <span>Імпорт виконується у фоновому режимі (BullMQ)</span>
          </div>

          <Button
            size="sm"
            onClick={onClose}
            className="text-xs px-4 bg-primary text-primary-foreground"
          >
            {t('suppliers:continueWorkCloseModal', {
              defaultValue: 'Продовжити роботу (закрити вікно)',
            })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-2 shrink-0">
      {step === 'SOURCE' ? (
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
          {t('common:cancel', { defaultValue: 'Скасувати' })}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          {t('common:back', { defaultValue: 'Назад' })}
        </Button>
      )}

      {step === 'SOURCE' && (
        <Button
          size="sm"
          onClick={onNextFromSource}
          disabled={
            (sourceType === 'URL' && !feedUrl.trim()) ||
            (sourceType === 'FILE' && !fileContent) ||
            isAnalyzing ||
            isFeedLimitReached
          }
          className="text-xs flex items-center gap-1.5"
          title={
            isFeedLimitReached
              ? t('suppliers:feedLimitReachedTooltip', {
                  defaultValue:
                    'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
                })
              : undefined
          }
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1" />
              {t('suppliers:analyzing', { defaultValue: 'Аналіз...' })}
            </>
          ) : (
            <>
              {t('suppliers:nextStep', { defaultValue: 'Далі до постачальника' })}
              <ArrowRight className="size-3.5" />
            </>
          )}
        </Button>
      )}

      {step === 'SUPPLIER' && (
        <Button
          size="sm"
          onClick={onNextFromSupplier}
          disabled={!selectedSupplierId || isAnalyzing || !hasSuppliers}
          className="text-xs flex items-center gap-1.5"
          title={
            !hasSuppliers
              ? t('suppliers:noSuppliersTooltip', {
                  defaultValue: 'Спочатку створіть постачальника для продовження',
                })
              : undefined
          }
        >
          {isAnalyzing && <Loader2 className="size-3.5 animate-spin" />}
          {t('suppliers:nextToPreview', { defaultValue: 'Переглянути товари' })}
          <ArrowRight className="size-3.5" />
        </Button>
      )}

      {step === 'PREVIEW' && (
        <Button
          size="sm"
          onClick={onStartImport}
          disabled={isQuotaExceeded || totalSelectedSkus === 0 || isImporting || isFeedLimitReached}
          title={
            isFeedLimitReached
              ? t('suppliers:feedLimitReachedTooltip', {
                  defaultValue:
                    'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
                })
              : isQuotaExceeded
                ? t('suppliers:quotaExceededBtnTooltip', {
                    selected: totalSelectedSkus.toLocaleString('uk-UA'),
                    remaining: remainingQuota.toLocaleString('uk-UA'),
                    defaultValue: `Перевищено ліміт: обрано ${totalSelectedSkus} з ${remainingQuota} доступних SKU. Зніміть зайві категорії.`,
                  })
                : totalSelectedSkus === 0
                  ? t('suppliers:noCategoriesSelectedBtnTooltip', {
                      defaultValue: 'Оберіть хоча б одну категорію для продовження',
                    })
                  : undefined
          }
          className={`text-xs flex items-center gap-1.5 shadow-sm transition-all ${
            isQuotaExceeded || totalSelectedSkus === 0 || isFeedLimitReached
              ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <Check className="size-3.5" />
          {t('suppliers:startImport', { defaultValue: 'Розпочати імпорт' })}
        </Button>
      )}
    </div>
  );
};
