import { createPortal } from 'react-dom';
import type { SupplierDto } from '@smartfeed/shared';
import { WizardStepSource } from './WizardStepSource';
import { WizardStepSupplier } from './WizardStepSupplier';
import { WizardStepPreview } from './WizardStepPreview';
import { WizardStepProgress } from './WizardStepProgress';
import { CreateSupplierDialog } from '@/components/suppliers/CreateSupplierDialog';
import { WizardDialogHeader } from './WizardDialogHeader';
import { WizardDialogFooter } from './WizardDialogFooter';
import { AlertCircle } from 'lucide-react';
import { useImportFeedWizard } from './useImportFeedWizard';

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
  const {
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
  } = useImportFeedWizard({
    suppliers,
    initialSupplierId,
    onSuccess,
    onClose,
  });

  if (!isOpen) return null;

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
