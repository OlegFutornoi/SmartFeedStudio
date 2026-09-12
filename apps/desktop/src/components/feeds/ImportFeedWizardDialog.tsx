import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { useQuotas } from '@/hooks/useQuotas';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  analyzeFeedUrl,
  analyzeFeedContent,
  importFeedAsync,
  createSupplier,
  FeedAnalysisResult,
  ImportFeedResultDto,
} from '@/lib/api';
import { WizardStepSource } from './WizardStepSource';
import { WizardStepSupplier } from './WizardStepSupplier';
import { WizardStepPreview } from './WizardStepPreview';
import { WizardStepProgress } from './WizardStepProgress';
import { CreateSupplierDialog } from '@/components/suppliers/CreateSupplierDialog';
import { WizardDialogHeader, WizardStep } from './WizardDialogHeader';
import { WizardDialogFooter } from './WizardDialogFooter';
import { AlertCircle } from 'lucide-react';
import { emitDataSync } from '@/lib/syncEvents';

interface ImportFeedWizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierDto[];
  initialSupplierId?: string;
  onSuccess?: () => void;
}

export function ImportFeedWizardDialog({
  isOpen,
  onClose,
  suppliers,
  initialSupplierId,
  onSuccess,
}: ImportFeedWizardDialogProps) {
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

  // Sync initialSupplierId when dialog opens or suppliers change
  useEffect(() => {
    if (initialSupplierId) {
      setSelectedSupplierId(initialSupplierId);
    } else if (localSuppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(localSuppliers[0].id);
    }
  }, [initialSupplierId, localSuppliers, selectedSupplierId]);

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
      console.error('Failed to create supplier in wizard:', e);
      throw e;
    }
  };

  if (!isOpen) return null;

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
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileSelect = async (name: string, content: string) => {
    setFileName(name);
    setFileContent(content);
    setAnalysisError(null);
    setAnalysis(null);
    await performAnalysis(content);
  };

  const performAnalysis = async (customContent?: string, customUrl?: string): Promise<boolean> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      let result: FeedAnalysisResult;
      const targetUrl = customUrl ?? feedUrl;
      const targetContent = customContent ?? fileContent;

      if (sourceType === 'URL') {
        if (!targetUrl.trim()) {
          setAnalysisError('Введіть посилання на фід');
          setIsAnalyzing(false);
          return false;
        }
        result = await analyzeFeedUrl(targetUrl.trim(), selectedSupplierId || undefined);
      } else {
        if (!targetContent) {
          setAnalysisError('Оберіть файл для імпорту');
          setIsAnalyzing(false);
          return false;
        }
        result = await analyzeFeedContent(targetContent, selectedSupplierId || undefined);
      }
      setAnalysis(result);
      // Select all categories by default on analysis
      if (result.categories && result.categories.length > 0) {
        setSelectedCategoryIds(result.categories.map((c) => c.id));
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка аналізу фіду';
      setAnalysisError(msg);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze only — no step transition. Called from "Аналізувати" button.
  const handleAnalyzeOnly = async () => {
    await performAnalysis();
    // Stay on SOURCE step — analysis result shown inline
  };

  // Next from SOURCE — if not analyzed yet, analyze first then transition
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
    // Re-analyze with chosen supplier to show updated markup in preview
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
        fileContent: sourceType === 'FILE' ? fileContent! : undefined,
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-[95vw] max-w-6xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header (100% solid background) */}
        <WizardDialogHeader step={step} onClose={handleClose} />

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-card">
          {isFeedLimitReached && (
            <div className="mb-4 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="size-4 shrink-0 text-amber-500" />
              <div className="flex-1">
                <span className="font-semibold">
                  {t('suppliers:feedLimitReachedTitle', {
                    defaultValue: 'Ліміт джерел фідів вичерпано',
                  })}
                  :{' '}
                </span>
                <span>
                  {t('suppliers:feedLimitReachedDesc', {
                    defaultValue:
                      'Ваш поточний тариф дозволяє підключити обмежену кількість фідів. Щоб імпортувати новий фід, оновіть тариф або видаліть існуюче джерело.',
                  })}
                </span>
              </div>
            </div>
          )}
          {step === 'SOURCE' && (
            <WizardStepSource
              sourceType={sourceType}
              setSourceType={setSourceType}
              feedUrl={feedUrl}
              setFeedUrl={setFeedUrl}
              fileContent={fileContent}
              fileName={fileName}
              onFileSelect={handleFileSelect}
              isAnalyzing={isAnalyzing}
              onAnalyzeUrl={handleAnalyzeOnly}
              onAnalyzeFile={handleAnalyzeOnly}
              analysis={analysis}
              error={analysisError}
            />
          )}

          {step === 'SUPPLIER' && (
            <WizardStepSupplier
              suppliers={localSuppliers}
              selectedSupplierId={selectedSupplierId}
              setSelectedSupplierId={setSelectedSupplierId}
              autoUpdatePrices={autoUpdatePrices}
              setAutoUpdatePrices={setAutoUpdatePrices}
              autoUpdateStocks={autoUpdateStocks}
              setAutoUpdateStocks={setAutoUpdateStocks}
              onOpenCreateSupplier={() => setIsCreateSupplierOpen(true)}
            />
          )}

          {step === 'PREVIEW' && analysis && (
            <WizardStepPreview
              analysis={analysis}
              selectedCategoryIds={selectedCategoryIds}
              setSelectedCategoryIds={setSelectedCategoryIds}
              remainingQuota={remainingQuota}
              isUnlimited={isUnlimited}
            />
          )}

          {step === 'PROGRESS' && (
            <WizardStepProgress
              isImporting={isImporting}
              result={importResult}
              error={importError}
            />
          )}
        </div>

        {/* Footer (100% solid background) */}
        <WizardDialogFooter
          step={step}
          sourceType={sourceType}
          feedUrl={feedUrl}
          fileContent={fileContent}
          selectedSupplierId={selectedSupplierId}
          hasSuppliers={localSuppliers.length > 0}
          isAnalyzing={isAnalyzing}
          isImporting={isImporting}
          isFeedLimitReached={isFeedLimitReached}
          isQuotaExceeded={isQuotaExceeded}
          totalSelectedSkus={totalSelectedSkus}
          remainingQuota={remainingQuota}
          analysis={analysis}
          onClose={handleClose}
          onBack={() => {
            if (step === 'SUPPLIER') setStep('SOURCE');
            if (step === 'PREVIEW') setStep('SUPPLIER');
          }}
          onNextFromSource={handleNextFromSource}
          onNextFromSupplier={handleNextFromSupplier}
          onStartImport={handleStartImport}
        />
      </div>

      {isCreateSupplierOpen && (
        <CreateSupplierDialog
          isOpen={isCreateSupplierOpen}
          onClose={() => setIsCreateSupplierOpen(false)}
          onSave={handleSaveSupplier}
        />
      )}
    </div>,
    document.body,
  );
}
