import type { FeedAnalysisResult } from '@/lib/api';
import type { WizardStep } from '@/components/feeds/WizardDialogHeader';

interface UseWizardStepValidationProps {
  t: (key: string, options?: { defaultValue?: string }) => string;
  isFeedLimitReached: boolean;
  selectedSupplierId: string;
  analysis: FeedAnalysisResult | null;
  performAnalysis: () => Promise<boolean>;
  setAnalysisError: (err: string | null) => void;
  setStep: (step: WizardStep) => void;
}

export function useWizardStepValidation({
  t,
  isFeedLimitReached,
  selectedSupplierId,
  analysis,
  performAnalysis,
  setAnalysisError,
  setStep,
}: UseWizardStepValidationProps) {
  const handleNextFromSource = async () => {
    if (isFeedLimitReached) {
      setAnalysisError(
        t('suppliers:feedLimitReachedDesc', {
          defaultValue:
            'Ваш поточний тариф дозволяє підключити обмежену кількість фідів. Щоб імпортувати новий фід, оновіть тариф або видаліть існуюче джерело.',
        }),
      );
      return;
    }
    if (!analysis) {
      const ok = await performAnalysis();
      if (!ok) return;
    }
    setStep('SUPPLIER');
  };

  const handleNextFromSupplier = async () => {
    if (!selectedSupplierId) {
      setAnalysisError(
        t('suppliers:selectSupplierError', {
          defaultValue: 'Оберіть постачальника для привʼязки фіду',
        }),
      );
      return;
    }
    setAnalysisError(null);
    if (!analysis) {
      const ok = await performAnalysis();
      if (!ok) return;
    }
    setStep('PREVIEW');
  };

  return {
    handleNextFromSource,
    handleNextFromSupplier,
  };
}
