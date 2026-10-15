import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  SupplierDto,
  CreateSupplierDto,
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
} from '@smartfeed/shared';
import { SupplierFormFields } from '@/modules/suppliers/components/forms/SupplierFormFields';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

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

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(CurrencyCode.UAH);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(supplierToEdit);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || '');
      setCode(supplierToEdit.code || '');
      setContactPhone(supplierToEdit.contactPhone || '');
      setContactEmail(supplierToEdit.contactEmail || '');
      setWebsite(supplierToEdit.website || '');
      setNotes(supplierToEdit.notes || '');
      setLogoUrl(supplierToEdit.logoUrl || null);
      setBaseCurrency(supplierToEdit.baseCurrency || CurrencyCode.UAH);
    } else {
      setName('');
      setCode('');
      setContactPhone('');
      setContactEmail('');
      setWebsite('');
      setNotes('');
      setLogoUrl(null);
      setBaseCurrency(CurrencyCode.UAH);
    }
    setError(null);
  }, [supplierToEdit, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && !code) {
      const generated = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .slice(0, 16);
      setCode(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('suppliers:nameRequired', { defaultValue: 'Вкажіть назву постачальника' }));
      return;
    }
    if (!code.trim()) {
      setError(t('suppliers:codeRequired', { defaultValue: 'Вкажіть системний код' }));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        logoUrl: logoUrl || undefined,
        baseCurrency,
        targetCurrency: supplierToEdit?.targetCurrency || CurrencyCode.UAH,
        exchangeRateMode: supplierToEdit?.exchangeRateMode || ExchangeRateMode.MANUAL,
        exchangeRate: supplierToEdit?.exchangeRate ?? 1.0,
        currencyBufferPercent: supplierToEdit?.currencyBufferPercent ?? 0,
        priceRounding: supplierToEdit?.priceRounding || PriceRoundingMode.NONE,
        defaultMarginPercent: supplierToEdit?.defaultMarginPercent ?? 0,
        defaultFixedMarkup: supplierToEdit?.defaultFixedMarkup ?? 0,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка збереження постачальника';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <SheetContent
        side="right"
        hideOverlay={true}
        onPointerDownOutside={onClose}
        className={cn(
          'p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl z-50 overflow-hidden outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0',
          'w-full sm:max-w-md md:max-w-lg lg:max-w-xl',
          'transition-all duration-250 ease-out',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:slide-out-to-right-6 data-[state=open]:slide-in-from-right-6',
        )}
        data-testid="supplier-form-sheet"
      >
        {/* 100% Solid Sticky Header */}
        <SheetHeader className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-border/80 text-left">
          <SheetTitle className="text-base font-bold text-foreground">
            {isEdit
              ? t('suppliers:editSupplierTitle', { defaultValue: 'Редагувати постачальника' })
              : t('suppliers:createSupplierTitle', { defaultValue: 'Новий постачальник' })}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {t('suppliers:formDesc', {
              defaultValue: 'Заповніть інформацію, логотип та контактні дані постачальника',
            })}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {error}
              </div>
            )}

            <SupplierFormFields
              name={name}
              setName={handleNameChange}
              code={code}
              setCode={setCode}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              website={website}
              setWebsite={setWebsite}
              notes={notes}
              setNotes={setNotes}
              logoUrl={logoUrl}
              setLogoUrl={setLogoUrl}
              baseCurrency={baseCurrency}
              setBaseCurrency={setBaseCurrency}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* 100% Solid Sticky Footer */}
          <SheetFooter className="sticky bottom-0 bg-card z-10 px-6 py-3 border-t border-border/80 flex items-center justify-end gap-2 mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 text-xs cursor-pointer"
              data-testid="supplier-sheet-cancel-btn"
            >
              {t('common:cancel', { defaultValue: 'Скасувати' })}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs gap-1.5 cursor-pointer"
              data-testid="supplier-sheet-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Збереження...
                </>
              ) : isEdit ? (
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
