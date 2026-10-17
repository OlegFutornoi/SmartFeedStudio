import type { FeedAnalysisResult } from '@/lib/api';
import type { WizardStep } from '@/components/feeds/WizardDialogHeader';

interface UseWizardStepValidationProps {
  t: (key: string, options?: { defaultValue?: string }) => string;
  isFeedLimitReached: boolean;
  selectedSupplierId: string;
  analysis: FeedAnalysisResult | null;
  setAnalysisError: (err: string | null) => void;
  setStep: (step: WizardStep) => void;
}

export function useWizardStepValidation({
  t,
  isFeedLimitReached,
  selectedSupplierId,
  analysis,
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
    if (!analysis || analysis.totalDetected === 0) {
      setAnalysisError(
        t('suppliers:mustAnalyzeFirst', {
          defaultValue:
            'Спочатку натисніть кнопку «Аналізувати» для перевірки фіду перед продовженням.',
        }),
      );
      return;
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
    if (!analysis || analysis.totalDetected === 0) {
      setAnalysisError(
        t('suppliers:mustAnalyzeFirst', {
          defaultValue:
            'Спочатку натисніть кнопку «Аналізувати» для перевірки фіду перед продовженням.',
        }),
      );
      return;
    }
    setStep('PREVIEW');
  };

  return {
    handleNextFromSource,
    handleNextFromSupplier,
  };
}
