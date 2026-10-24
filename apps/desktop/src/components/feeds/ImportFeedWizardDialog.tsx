import { useState, useEffect } from 'react';
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
import { useOptionalSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

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
    feedName,
    setFeedName,
    collisionResult,
    isCheckingCollision,
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
    selectedSupplier,
    existingFeedNames,
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

  const sidebar = useOptionalSidebar();
  const isSidebarCollapsed = sidebar?.isCollapsed ?? true;
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsExpanded(true);
      sidebar?.collapseSidebar();
    }
  }, [isOpen, sidebar]);

  const expandedWidthClass = isSidebarCollapsed
    ? 'w-full md:w-[calc(100vw-72px)] max-w-none'
    : 'w-full md:w-[calc(100vw-16rem)] max-w-none';

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <SheetContent
          side="right"
          hideCloseButton={true}
          className={cn(
            'p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-[60] overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded
              ? expandedWidthClass
              : 'w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl',
          )}
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
          <WizardDialogHeader
            step={step}
            isExpanded={isExpanded}
            onToggleExpand={() =>
              setIsExpanded((prev) => {
                const next = !prev;
                if (next) sidebar?.collapseSidebar();
                return next;
              })
            }
            onClose={handleClose}
          />

          {/* Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-background">
            {isFeedLimitReached && (
              <div className="mb-4 p-3 rounded-lg border border-border/60 bg-card text-foreground text-xs flex items-center gap-2.5">
                <AlertCircle className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <span className="font-semibold">
                    {t('suppliers:feedLimitReachedTitle', {
                      defaultValue: 'Ліміт джерел фідів вичерпано',
                    })}
                    :{' '}
                  </span>
                  <span className="text-muted-foreground">
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
                feedName={feedName}
                setFeedName={setFeedName}
                supplierName={selectedSupplier?.name}
                existingFeedNames={existingFeedNames}
                collisionResult={collisionResult}
                isCheckingCollision={isCheckingCollision}
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
            collisionResult={collisionResult}
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
