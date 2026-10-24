import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Maximize2, Minimize2, X } from 'lucide-react';
import { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { SupplierFormFields } from '@/modules/suppliers/components/forms/SupplierFormFields';
import { useSupplierFormState } from '@/modules/suppliers/components/forms/useSupplierFormState';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';
import { useOptionalSidebar } from '@/contexts/SidebarContext';

export interface SupplierFormSheetProps {
  isOpen: boolean;
  supplierToEdit?: SupplierDto | null;
  onClose: () => void;
  onSave: (payload: CreateSupplierDto) => Promise<void>;
}

export const SupplierFormSheet: React.FC<SupplierFormSheetProps> = ({
  isOpen,
  supplierToEdit,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const sidebar = useOptionalSidebar();
  const isSidebarCollapsed = sidebar?.isCollapsed ?? true;
  const formState = useSupplierFormState({ supplierToEdit, isOpen, onSave, onClose });

  const expandedWidthClass = isSidebarCollapsed
    ? 'w-full md:w-[calc(100vw-72px)] max-w-none'
    : 'w-full md:w-[calc(100vw-16rem)] max-w-none';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <SheetContent
        side="right"
        hideOverlay={true}
        hideCloseButton={true}
        onPointerDownOutside={onClose}
        className={cn(
          'p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-50 overflow-hidden outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 transition-all duration-300 ease-in-out',
          formState.isExpanded
            ? expandedWidthClass
            : 'w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl',
        )}
        data-testid="supplier-form-sheet"
      >
        {/* 100% Solid Sticky Header matching Cabinet dimensions */}
        <SheetHeader className="sticky top-0 bg-card z-10 px-6 py-3.5 border-b border-border/80 text-left flex flex-row items-center justify-between space-y-0">
          <div>
            <SheetTitle className="text-base font-bold text-foreground">
              {formState.isEdit
                ? t('suppliers:editSupplierTitle', { defaultValue: 'Редагувати постачальника' })
                : t('suppliers:createSupplierTitle', { defaultValue: 'Новий постачальник' })}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              {t('suppliers:formDesc', {
                defaultValue: 'Заповніть інформацію, валютні параметри та базову націнку',
              })}
            </SheetDescription>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => formState.setIsExpanded((v) => !v)}
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
              title={
                formState.isExpanded
                  ? t('suppliers:collapseFullscreen')
                  : t('suppliers:expandFullscreen')
              }
            >
              {formState.isExpanded ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
            >
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={formState.handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {formState.error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {formState.error}
              </div>
            )}

            <SupplierFormFields
              name={formState.name}
              setName={formState.handleNameChange}
              code={formState.code}
              setCode={formState.setCode}
              contactPhone={formState.contactPhone}
              setContactPhone={formState.setContactPhone}
              contactEmail={formState.contactEmail}
              setContactEmail={formState.setContactEmail}
              website={formState.website}
              setWebsite={formState.setWebsite}
              notes={formState.notes}
              setNotes={formState.setNotes}
              logoUrl={formState.logoUrl}
              setLogoUrl={formState.setLogoUrl}
              baseCurrency={formState.baseCurrency}
              setBaseCurrency={formState.setBaseCurrency}
              legalName={formState.legalName}
              setLegalName={formState.setLegalName}
              taxId={formState.taxId}
              setTaxId={formState.setTaxId}
              industry={formState.industry}
              setIndustry={formState.setIndustry}
              segment={formState.segment}
              setSegment={formState.setSegment}
              managerName={formState.managerName}
              setManagerName={formState.setManagerName}
              managerPosition={formState.managerPosition}
              setManagerPosition={formState.setManagerPosition}
              managerPhone={formState.managerPhone}
              setManagerPhone={formState.setManagerPhone}
              managerEmail={formState.managerEmail}
              setManagerEmail={formState.setManagerEmail}
              managerTelegram={formState.managerTelegram}
              setManagerTelegram={formState.setManagerTelegram}
              country={formState.country}
              setCountry={formState.setCountry}
              city={formState.city}
              setCity={formState.setCity}
              address={formState.address}
              setAddress={formState.setAddress}
              postcode={formState.postcode}
              setPostcode={formState.setPostcode}
              isSubmitting={formState.isSubmitting}
            />
          </div>

          {/* 100% Solid Sticky Footer */}
          <SheetFooter className="sticky bottom-0 bg-card z-10 px-6 py-3 border-t border-border/80 flex items-center justify-end gap-2 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={formState.isSubmitting}
              className="h-8 text-xs cursor-pointer"
              data-testid="supplier-sheet-cancel-btn"
            >
              {t('common:cancel', { defaultValue: 'Скасувати' })}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={formState.isSubmitting}
              className="h-8 text-xs gap-1.5 cursor-pointer"
              data-testid="supplier-sheet-submit-btn"
            >
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t('common:saving', { defaultValue: 'Збереження...' })}
                </>
              ) : formState.isEdit ? (
                t('common:save', { defaultValue: 'Зберегти зміни' })
              ) : (
                t('suppliers:createSupplier', { defaultValue: 'Створити постачальника' })
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
