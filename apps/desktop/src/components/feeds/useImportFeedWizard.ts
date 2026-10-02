import { useState, useEffect, useMemo, useRef } from 'react';
import type { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { useQuotas } from '@/hooks/useQuotas';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  analyzeFeedUrl,
  analyzeFeedContent,
  importFeedAsync,
  createSupplier,
  type FeedAnalysisResult,
  type ImportFeedResultDto,
} from '@/lib/api';
import type { WizardStep } from './WizardDialogHeader';
import { emitDataSync } from '@/lib/syncEvents';
import { getFeedAnalysisErrorMessage } from './feedErrorMessages';

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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FeedAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportFeedResultDto | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Quota & Selected SKUs calculation
  const productQuota = quotas?.products;
  const isUnlimited = productQuota?.isUnlimited ?? false;
  const remainingQuota = productQuota ? Math.max(0, productQuota.max - productQuota.used) : 10000;

  const totalSelectedSkus = useMemo(() => {
    if (!analysis) return 0;
    const cats = analysis.categories || [];
    if (cats.length === 0) return analysis.totalDetected;
    if (selectedCategoryIds.length === 0) return 0;
    const selectedSet = new Set(selectedCategoryIds);
    return cats
      .filter((c) => selectedSet.has(c.id))
      .reduce((sum, c) => sum + (c.productCount || 0), 0);
  }, [analysis, selectedCategoryIds]);

  const isQuotaExceeded = !isUnlimited && totalSelectedSkus > remainingQuota;

  const prevIsOpenRef = useRef(isOpen);
  const prevInitialSupplierIdRef = useRef(initialSupplierId);

  // Sync initialSupplierId only when dialog opens or initialSupplierId prop changes
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const initialChanged = initialSupplierId !== prevInitialSupplierIdRef.current;

    prevIsOpenRef.current = isOpen;
    prevInitialSupplierIdRef.current = initialSupplierId;

    if (justOpened || initialChanged) {
      if (initialSupplierId) {
        setSelectedSupplierId(initialSupplierId);
      } else if (localSuppliers.length > 0) {
        setSelectedSupplierId((prev) => {
          return localSuppliers.some((s) => s.id === prev) ? prev : localSuppliers[0].id;
        });
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
    setFileName(null);
    setFileContent(null);
    setIsAnalyzing(false);
    setAnalysis(null);
    setAnalysisError(null);
    setSelectedCategoryIds([]);
    setIsImporting(false);
    setImportResult(null);
    setImportError(null);
    setSelectedSupplierId(initialSupplierId || (suppliers[0]?.id ?? ''));
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const performAnalysis = async (customContent?: string, customUrl?: string): Promise<boolean> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      let result: FeedAnalysisResult;
      const targetUrl = customUrl ?? feedUrl;
      const targetContent = customContent ?? fileContent;

      if (sourceType === 'URL') {
        if (!targetUrl.trim()) {
          setAnalysisError(
            t('suppliers:enterFeedUrl', { defaultValue: 'Введіть посилання на фід' }),
          );
          setIsAnalyzing(false);
          return false;
        }
        result = await analyzeFeedUrl(targetUrl.trim(), selectedSupplierId || undefined);
      } else {
        if (!targetContent) {
          setAnalysisError(
            t('suppliers:chooseFileForImport', { defaultValue: 'Оберіть файл для імпорту' }),
          );
          setIsAnalyzing(false);
          return false;
        }
        result = await analyzeFeedContent(targetContent, selectedSupplierId || undefined);
      }
      setAnalysis(result);
      if (result.categories && result.categories.length > 0) {
        setSelectedCategoryIds(result.categories.map((c) => c.id));
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalysisError(getFeedAnalysisErrorMessage(msg, t));
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = async (name: string, content: string) => {
    setFileName(name);
    setFileContent(content);
    setAnalysisError(null);
    setAnalysis(null);
    await performAnalysis(content);
  };

  const handleAnalyzeOnly = async () => {
    await performAnalysis();
  };

  const handleNextFromSource = async () => {
    if (isFeedLimitReached) return;
    if (!analysis) {
      const ok = await performAnalysis();
      if (!ok) return;
    }
    setStep('SUPPLIER');
  };

  const handleNextFromSupplier = async () => {
    if (!selectedSupplierId) {
      setAnalysisError('Оберіть постачальника для привʼязки фіду');
      return;
    }
    await performAnalysis();
    setStep('PREVIEW');
  };

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
        selectedCategoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        autoUpdatePrices,
        autoUpdateStocks,
      });

      addTrackedJob(asyncRes.jobId);

      setImportResult({
        feedSourceId: asyncRes.feedSourceId,
        totalItems: analysis?.totalDetected || 0,
        createdItems: analysis?.totalDetected || 0,
        updatedItems: 0,
        categoriesCreated: selectedCategoryIds.length,
        format: analysis?.format || 'XML',
      });

      refreshQuotas();
      emitDataSync(['suppliers', 'feeds', 'products', 'quotas']);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка під час запуску імпорту товарів';
      setImportError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return {
    t,
    step,
    setStep,
    sourceType,
    setSourceType,
    feedUrl,
    setFeedUrl,
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
    handleAnalyzeOnly,
    handleNextFromSource,
    handleNextFromSupplier,
    handleStartImport,
  };
}
