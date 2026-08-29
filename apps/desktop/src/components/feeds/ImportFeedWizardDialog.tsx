import { useState, useEffect } from 'react';
import { SupplierDto } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { useQuotas } from '@/hooks/useQuotas';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import {
  analyzeFeedUrl,
  analyzeFeedContent,
  importFeedAsync,
  FeedAnalysisResult,
  ImportFeedResultDto,
} from '@/lib/api';
import { WizardStepSource } from './WizardStepSource';
import { WizardStepSupplier } from './WizardStepSupplier';
import { WizardStepPreview } from './WizardStepPreview';
import { WizardStepProgress } from './WizardStepProgress';
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X, Radio } from 'lucide-react';
import { emitDataSync } from '@/lib/syncEvents';

interface ImportFeedWizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierDto[];
  initialSupplierId?: string;
  onSuccess?: () => void;
}

type WizardStep = 'SOURCE' | 'SUPPLIER' | 'PREVIEW' | 'PROGRESS';

export function ImportFeedWizardDialog({
  isOpen,
  onClose,
  suppliers,
  initialSupplierId,
  onSuccess,
}: ImportFeedWizardDialogProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const { quotas, refreshQuotas } = useQuotas();
  const { addTrackedJob } = useBackgroundJobs();

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

  // Quota calculation
  const productQuota = quotas?.products;
  const remainingQuota = productQuota ? Math.max(0, productQuota.max - productQuota.used) : 10000;

  // Sync initialSupplierId when dialog opens
  useEffect(() => {
    if (initialSupplierId) {
      setSelectedSupplierId(initialSupplierId);
    } else if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [initialSupplierId, suppliers, selectedSupplierId]);

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

  const handleFileSelect = (name: string, content: string) => {
    setFileName(name);
    setFileContent(content);
    setAnalysisError(null);
  };

  const performAnalysis = async (): Promise<boolean> => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      let result: FeedAnalysisResult;
      if (sourceType === 'URL') {
        if (!feedUrl.trim()) {
          setAnalysisError('Введіть посилання на фід');
          setIsAnalyzing(false);
          return false;
        }
        result = await analyzeFeedUrl(feedUrl.trim(), selectedSupplierId || undefined);
      } else {
        if (!fileContent) {
          setAnalysisError('Оберіть файл для імпорту');
          setIsAnalyzing(false);
          return false;
        }
        result = await analyzeFeedContent(fileContent, selectedSupplierId || undefined);
      }
      setAnalysis(result);
      // Select all categories by default on analysis
      if (result.categories && result.categories.length > 0) {
        setSelectedCategoryIds(result.categories.map((c) => c.id));
      }
      return true;
    } catch (err: any) {
      setAnalysisError(err.message || 'Помилка аналізу фіду');
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextFromSource = async () => {
    const success = await performAnalysis();
    if (success) {
      setStep('SUPPLIER');
    }
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
    } catch (err: any) {
      setImportError(err.message || 'Помилка під час запуску імпорту товарів');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (100% solid background) */}
        <div className="p-5 border-b border-border bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {t('suppliers:importWizardTitle', { defaultValue: 'Майстер Імпорту Фідів' })}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 'SOURCE' && 'Крок 1 з 4: Джерело даних (URL або файл)'}
                {step === 'SUPPLIER' && 'Крок 2 з 4: Постачальник та правила націнки'}
                {step === 'PREVIEW' && 'Крок 3 з 4: Попередній перегляд та вибір категорій'}
                {step === 'PROGRESS' && 'Крок 4 з 4: Фонова черга обробки товарів'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              {(['SOURCE', 'SUPPLIER', 'PREVIEW', 'PROGRESS'] as WizardStep[]).map((s, i) => (
                <div
                  key={s}
                  className={`size-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
                    step === s
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : i < ['SOURCE', 'SUPPLIER', 'PREVIEW', 'PROGRESS'].indexOf(step)
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
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-card">
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
              onAnalyzeUrl={handleNextFromSource}
              error={analysisError}
            />
          )}

          {step === 'SUPPLIER' && (
            <WizardStepSupplier
              suppliers={suppliers}
              selectedSupplierId={selectedSupplierId}
              setSelectedSupplierId={setSelectedSupplierId}
              autoUpdatePrices={autoUpdatePrices}
              setAutoUpdatePrices={setAutoUpdatePrices}
              autoUpdateStocks={autoUpdateStocks}
              setAutoUpdateStocks={setAutoUpdateStocks}
            />
          )}

          {step === 'PREVIEW' && analysis && (
            <WizardStepPreview
              analysis={analysis}
              selectedCategoryIds={selectedCategoryIds}
              setSelectedCategoryIds={setSelectedCategoryIds}
              remainingQuota={remainingQuota}
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
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-2 shrink-0">
          {step !== 'PROGRESS' ? (
            <>
              {step === 'SOURCE' ? (
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs">
                  {t('common:cancel', { defaultValue: 'Скасувати' })}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (step === 'SUPPLIER') setStep('SOURCE');
                    if (step === 'PREVIEW') setStep('SUPPLIER');
                  }}
                  className="text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  {t('common:back', { defaultValue: 'Назад' })}
                </Button>
              )}

              {step === 'SOURCE' && (
                <Button
                  size="sm"
                  onClick={handleNextFromSource}
                  disabled={
                    (sourceType === 'URL' && !feedUrl.trim()) ||
                    (sourceType === 'FILE' && !fileContent) ||
                    isAnalyzing
                  }
                  className="text-xs flex items-center gap-1.5"
                >
                  {isAnalyzing && <Loader2 className="size-3.5 animate-spin" />}
                  {t('suppliers:nextStep', { defaultValue: 'Далі до постачальника' })}
                  <ArrowRight className="size-3.5" />
                </Button>
              )}

              {step === 'SUPPLIER' && (
                <Button
                  size="sm"
                  onClick={handleNextFromSupplier}
                  disabled={!selectedSupplierId || isAnalyzing}
                  className="text-xs flex items-center gap-1.5"
                >
                  {isAnalyzing && <Loader2 className="size-3.5 animate-spin" />}
                  {t('suppliers:nextToPreview', { defaultValue: 'Переглянути товари' })}
                  <ArrowRight className="size-3.5" />
                </Button>
              )}

              {step === 'PREVIEW' && (
                <Button
                  size="sm"
                  onClick={handleStartImport}
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="size-3.5" />
                  {t('suppliers:startImport', { defaultValue: 'Розпочати імпорт' })}
                </Button>
              )}
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Radio className="size-3.5 text-emerald-400 animate-pulse" />
                <span>Імпорт виконується у фоновому режимі (BullMQ)</span>
              </div>

              <Button
                size="sm"
                onClick={handleClose}
                className="text-xs px-4 bg-primary text-primary-foreground"
              >
                {t('suppliers:continueWorkCloseModal', {
                  defaultValue: 'Продовжити роботу (закрити вікно)',
                })}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
