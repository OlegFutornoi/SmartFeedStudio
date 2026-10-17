import { FeedCollisionResultDto, FeedCollisionType } from '@smartfeed/shared';
import type { FeedAnalysisResult } from '@/lib/api';
import type { WizardStep } from '@/components/feeds/WizardDialogHeader';

interface UseWizardStepValidationProps {
  t: (key: string, options?: { defaultValue?: string; name?: string; count?: number }) => string;
  isFeedLimitReached: boolean;
  selectedSupplierId: string;
  analysis: FeedAnalysisResult | null;
  collisionResult?: FeedCollisionResultDto | null;
  setAnalysisError: (err: string | null) => void;
  setStep: (step: WizardStep) => void;
}

export function useWizardStepValidation({
  t,
  isFeedLimitReached,
  selectedSupplierId,
  analysis,
  collisionResult,
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
    if (
      collisionResult?.hasCollision &&
      collisionResult.collisionType === FeedCollisionType.SAME_SUPPLIER_DUPLICATE
    ) {
      setAnalysisError(
        t('suppliers:feedSameSupplierDuplicateMsg', {
          name: collisionResult.existingFeedName || 'Існуючий фід',
          count: collisionResult.existingProductsCount || 0,
          defaultValue: `Цей фід уже підключений під назвою «${collisionResult.existingFeedName}» (${collisionResult.existingProductsCount} товарів). Створення дубліката заблоковано.`,
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
