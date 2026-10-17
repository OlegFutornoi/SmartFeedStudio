import type { SupplierDto } from '@smartfeed/shared';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { WizardStepSource } from '@/components/feeds/WizardStepSource';
import { WizardStepSupplier } from '@/components/feeds/WizardStepSupplier';
import { WizardStepPreview } from '@/components/feeds/WizardStepPreview';
import { WizardStepProgress } from '@/components/feeds/WizardStepProgress';
import { SupplierFormSheet } from '@/modules/suppliers/components/forms/SupplierFormSheet';
import { WizardDialogHeader } from '@/components/feeds/WizardDialogHeader';
import { WizardDialogFooter } from '@/components/feeds/WizardDialogFooter';
import { AlertCircle } from 'lucide-react';
import { useImportFeedWizard } from '@/components/feeds/useImportFeedWizard';

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
    handleNextFromSource,
    handleNextFromSupplier,
    handleStartImport,
  } = useImportFeedWizard({
    isOpen,
    suppliers,
    initialSupplierId,
    onSuccess,
    onClose,
  });

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          hideCloseButton={true}
          className="p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-[60] overflow-hidden w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl transition-all duration-300 ease-in-out"
          data-testid="import-feed-wizard-sheet"
        >
          <SheetTitle asChild>
            <span className="sr-only">
              {t('suppliers:importWizardTitle', { defaultValue: 'Майстер Імпорту Фідів' })}
            </span>
          </SheetTitle>
          <SheetDescription asChild>
            <span className="sr-only">
              {t('suppliers:importWizardSubtitle', {
                defaultValue: 'Імпорт XML та CSV каталогів товарів',
              })}
            </span>
          </SheetDescription>

          {/* Header (100% solid background) */}
          <WizardDialogHeader step={step} onClose={handleClose} />

          {/* Content Body */}
          <div className="p-4 sm:p-5 pt-3 sm:pt-4 overflow-y-auto flex-1 bg-card">
            {isFeedLimitReached && (
              <div className="mb-4 p-3.5 rounded-xl border border-border bg-muted/60 text-foreground text-xs flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0 text-foreground" />
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
                onAnalyzeUrl={handleAnalyzeUrl}
                onAnalyzeFile={handleAnalyzeFile}
                analysis={analysis}
                error={analysisError}
              />
            )}

            {step === 'SUPPLIER' && (
              <WizardStepSupplier
                suppliers={localSuppliers}
                selectedSupplierId={selectedSupplierId}
                setSelectedSupplierId={setSelectedSupplierId}
                analysis={analysis}
                onOpenCreateSupplier={() => setIsCreateSupplierOpen(true)}
                error={analysisError}
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
        </SheetContent>
      </Sheet>

      {isCreateSupplierOpen && (
        <SupplierFormSheet
          isOpen={isCreateSupplierOpen}
          onClose={() => setIsCreateSupplierOpen(false)}
          onSave={handleSaveSupplier}
        />
      )}
    </>
  );
}
