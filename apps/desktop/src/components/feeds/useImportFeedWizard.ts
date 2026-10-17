import { useState, useEffect, useRef } from 'react';
import type { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { useQuotas } from '@/hooks/useQuotas';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import { useAuth } from '@/contexts/AuthContext';
import { importFeedAsync, createSupplier, type ImportFeedResultDto } from '@/lib/api';
import type { WizardStep } from '@/components/feeds/WizardDialogHeader';
import { emitDataSync } from '@/lib/syncEvents';
import { useWizardStepMapping } from '@/components/feeds/useWizardStepMapping';
import { useWizardStepValidation } from '@/components/feeds/useWizardStepValidation';
import { useFeedAnalysis } from '@/components/feeds/useFeedAnalysis';

interface UseImportFeedWizardOptions {
  isOpen: boolean;
  suppliers: SupplierDto[];
  initialSupplierId?: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function useImportFeedWizard({
  isOpen,
  suppliers,
  initialSupplierId,
  onSuccess,
  onClose,
}: UseImportFeedWizardOptions) {
  const { t } = useTranslation(['suppliers', 'common']);
  const { quotas, refreshQuotas, isFeedLimitReached } = useQuotas();
  const { addTrackedJob } = useBackgroundJobs();
  const { token } = useAuth();

  const [localSuppliers, setLocalSuppliers] = useState<SupplierDto[]>(suppliers);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);

  useEffect(() => {
    setLocalSuppliers(suppliers);
  }, [suppliers]);

  const [step, setStep] = useState<WizardStep>('SOURCE');
  const [sourceType, setSourceType] = useState<'URL' | 'FILE'>('URL');
  const [feedUrl, setFeedUrl] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialSupplierId || (suppliers[0]?.id ?? ''),
  );
  const [autoUpdatePrices, setAutoUpdatePrices] = useState(true);
  const [autoUpdateStocks, setAutoUpdateStocks] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportFeedResultDto | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const {
    isAnalyzing,
    analysis,
    analysisError,
    setAnalysis,
    setAnalysisError,
    feedName,
    setFeedName,
    collisionResult,
    setCollisionResult,
    isCheckingCollision,
    checkCollision,
    handleAnalyzeUrl,
    handleAnalyzeFile,
    handleAnalyzeOnly,
  } = useFeedAnalysis({
    t,
    sourceType,
    feedUrl,
    setFeedUrl,
    fileName,
    fileContent,
    selectedSupplierId,
    token,
    onCategoriesDetected: setSelectedCategoryIds,
  });

  const { totalSelectedSkus, isQuotaExceeded, isUnlimited, remainingQuota } = useWizardStepMapping({
    analysis,
    selectedCategoryIds,
    productQuota: quotas?.products,
  });

  const prevIsOpenRef = useRef(isOpen);
  const prevInitialSupplierIdRef = useRef(initialSupplierId);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const initialChanged = initialSupplierId !== prevInitialSupplierIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevInitialSupplierIdRef.current = initialSupplierId;

    if (justOpened || initialChanged) {
      if (initialSupplierId) setSelectedSupplierId(initialSupplierId);
      else if (localSuppliers.length > 0) {
        setSelectedSupplierId((prev) =>
          localSuppliers.some((s) => s.id === prev) ? prev : localSuppliers[0].id,
        );
      }
    } else if (localSuppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(localSuppliers[0].id);
    }
  }, [isOpen, initialSupplierId, localSuppliers, selectedSupplierId]);

  const handleSaveSupplier = async (dto: CreateSupplierDto) => {
    try {
      const created = await createSupplier(dto, token || undefined);
      if (created) {
        setLocalSuppliers((prev) => [...prev, created]);
        setSelectedSupplierId(created.id);
        setIsCreateSupplierOpen(false);
        emitDataSync('suppliers');
      }
    } catch (e) {
      console.warn('[useImportFeedWizard] Failed to create supplier in wizard:', e);
      throw e;
    }
  };

  const handleReset = () => {
    setStep('SOURCE');
    setSourceType('URL');
    setFeedUrl('');
    setFeedName('');
    setFileName(null);
    setFileContent(null);
    setAnalysis(null);
    setAnalysisError(null);
    setCollisionResult(null);
    setSelectedCategoryIds([]);
    setIsImporting(false);
    setImportResult(null);
    setImportError(null);
    setSelectedSupplierId(initialSupplierId || (suppliers[0]?.id ?? ''));
  };

  const handleClose = () => {
    if (importResult) onSuccess?.();
    handleReset();
    onClose();
  };

  const handleSetFeedUrl = (url: string) => {
    setFeedUrl(url);
    if (!url.trim() && !fileName) {
      setFeedName('');
    }
    if (analysisError) setAnalysisError(null);
  };

  const handleSetSourceType = (type: 'URL' | 'FILE') => {
    setSourceType(type);
    if (analysisError) setAnalysisError(null);
  };

  const handleFileSelect = (name: string, content: string) => {
    setFileName(name || null);
    setFileContent(content || null);
    if (name) {
      setSourceType('FILE');
      setFeedUrl('');
      setFeedName(name);
    } else {
      if (!feedUrl.trim()) {
        setFeedName('');
      }
    }
    setAnalysisError(null);
    setAnalysis(null);
  };

  const { handleNextFromSource, handleNextFromSupplier } = useWizardStepValidation({
    t,
    isFeedLimitReached,
    selectedSupplierId,
    analysis,
    collisionResult,
    setAnalysisError,
    setStep,
  });

  const handleStartImport = async () => {
    if (isFeedLimitReached) {
      setImportError(
        t('suppliers:feedLimitReachedError', {
          defaultValue:
            'Ліміт джерел фідів вичерпано. Оновіть тарифний план або видаліть непотрібний фід.',
        }),
      );
      return;
    }
    if (!selectedSupplierId || !selectedSupplierId.trim()) {
      setImportError(
        t('suppliers:selectSupplierError', {
          defaultValue: 'Оберіть постачальника для привʼязки фіду',
        }),
      );
      return;
    }

    setStep('PROGRESS');
    setIsImporting(true);
    setImportError(null);

    try {
      const asyncRes = await importFeedAsync({
        supplierId: selectedSupplierId,
        sourceType,
        sourceUrl: sourceType === 'URL' ? feedUrl.trim() : undefined,
        fileContent: fileContent || analysis?.rawContent || undefined,
        fileName: fileName || undefined,
        feedName: feedName.trim() || undefined,
        selectedCategoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        autoUpdatePrices,
        autoUpdateStocks,
      });

      addTrackedJob(asyncRes.jobId);
      const actualCount =
        asyncRes.createdCount ??
        (totalSelectedSkus > 0 ? totalSelectedSkus : analysis?.totalDetected || 0);

      setImportResult({
        feedSourceId: asyncRes.feedSourceId,
        totalItems: actualCount,
        createdItems: actualCount,
        updatedItems: 0,
        categoriesCreated: selectedCategoryIds.length || 1,
        format: analysis?.format || 'XML',
      });
      refreshQuotas();
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas']);
    } catch (err: unknown) {
      setImportError(
        err instanceof Error ? err.message : 'Помилка під час запуску імпорту товарів',
      );
    } finally {
      setIsImporting(false);
    }
  };

  return {
    t,
    step,
    setStep,
    sourceType,
    setSourceType: handleSetSourceType,
    feedUrl,
    setFeedUrl: handleSetFeedUrl,
    feedName,
    setFeedName,
    collisionResult,
    setCollisionResult,
    isCheckingCollision,
    checkCollision,
    fileName,
    fileContent,
    selectedSupplierId,
    setSelectedSupplierId,
    autoUpdatePrices,
    setAutoUpdatePrices,
    autoUpdateStocks,
    setAutoUpdateStocks,
    isAnalyzing,
    analysis,
    analysisError,
    selectedCategoryIds,
    setSelectedCategoryIds,
    isImporting,
    importResult,
    importError,
    isUnlimited,
    remainingQuota,
    totalSelectedSkus,
    isQuotaExceeded,
    isFeedLimitReached,
    localSuppliers,
    isCreateSupplierOpen,
    setIsCreateSupplierOpen,
    handleSaveSupplier,
    handleClose,
    handleFileSelect,
    handleAnalyzeUrl,
    handleAnalyzeFile,
    handleAnalyzeOnly,
    handleNextFromSource,
    handleNextFromSupplier,
    handleStartImport,
  };
}
