import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SupplierDto,
  CreateSupplierDto,
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface SupplierCreateDialogProps {
  isOpen: boolean;
  supplierToEdit?: SupplierDto | null;
  onClose: () => void;
  onSave: (payload: CreateSupplierDto) => Promise<void>;
}

export const SupplierCreateDialog: React.FC<SupplierCreateDialogProps> = ({
  isOpen,
  supplierToEdit,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(CurrencyCode.UAH);
  const [exchangeRateMode, setExchangeRateMode] = useState<ExchangeRateMode>(
    ExchangeRateMode.MANUAL,
  );
  const [exchangeRate, setExchangeRate] = useState<number>(1.0);
  const [currencyBufferPercent, setCurrencyBufferPercent] = useState<number>(0);
  const [priceRounding, setPriceRounding] = useState<PriceRoundingMode>(PriceRoundingMode.NONE);
  const [defaultMarginPercent, setDefaultMarginPercent] = useState<number>(15);
  const [defaultFixedMarkup, setDefaultFixedMarkup] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || '');
      setCode(supplierToEdit.code || '');
      setContactEmail(supplierToEdit.contactEmail || '');
      setContactPhone(supplierToEdit.contactPhone || '');
      setWebsite(supplierToEdit.website || '');
      setBaseCurrency(supplierToEdit.baseCurrency || CurrencyCode.UAH);
      setExchangeRateMode(supplierToEdit.exchangeRateMode || ExchangeRateMode.MANUAL);
      setExchangeRate(supplierToEdit.exchangeRate || 1.0);
      setCurrencyBufferPercent(supplierToEdit.currencyBufferPercent || 0);
      setPriceRounding(supplierToEdit.priceRounding || PriceRoundingMode.NONE);
      setDefaultMarginPercent(supplierToEdit.defaultMarginPercent || 0);
      setDefaultFixedMarkup(supplierToEdit.defaultFixedMarkup || 0);
      setNotes(supplierToEdit.notes || '');
    } else {
      setName('');
      setCode('');
      setContactEmail('');
      setContactPhone('');
      setWebsite('');
      setBaseCurrency(CurrencyCode.UAH);
      setExchangeRateMode(ExchangeRateMode.MANUAL);
      setExchangeRate(1.0);
      setCurrencyBufferPercent(0);
      setPriceRounding(PriceRoundingMode.NONE);
      setDefaultMarginPercent(15);
      setDefaultFixedMarkup(0);
      setNotes('');
    }
    setError(null);
  }, [supplierToEdit, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!supplierToEdit && !code) {
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
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        website: website.trim() || undefined,
        baseCurrency,
        exchangeRateMode,
        exchangeRate,
        currencyBufferPercent,
        priceRounding,
        defaultMarginPercent,
        defaultFixedMarkup,
        notes: notes.trim() || undefined,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-xl max-h-[90vh] overflow-y-auto bg-card border-border/80 p-0 shadow-2xl"
        data-testid="supplier-create-dialog"
      >
        {/* 100% Solid Sticky Header */}
        <DialogHeader className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-border/80">
          <DialogTitle className="text-base font-bold text-foreground">
            {supplierToEdit
              ? t('suppliers:editSupplierTitle', { defaultValue: 'Редагувати постачальника' })
              : t('suppliers:createSupplierTitle', { defaultValue: 'Новий постачальник' })}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('suppliers:formDesc', {
              defaultValue: 'Заповніть інформацію, валютні параметри та базову націнку',
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Основна інформація
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Назва постачальника *
                </label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="напр. Brain Distribution"
                  className="h-8.5 text-xs bg-background/80"
                  required
                  data-testid="supplier-name-input"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Системний код *
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="BRAIN"
                  className="h-8.5 text-xs font-mono bg-background/80"
                  required
                  data-testid="supplier-code-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Email для замовлень
                </label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="orders@supplier.com"
                  className="h-8.5 text-xs bg-background/80"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Телефон менеджера
                </label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+380..."
                  className="h-8.5 text-xs bg-background/80"
                />
              </div>
            </div>
          </div>

          {/* Currencies & Pricing Defaults */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Валюта та базова націнка
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Валюта прайсу
                </label>
                <Select
                  value={baseCurrency}
                  onValueChange={(val) => setBaseCurrency(val as CurrencyCode)}
                >
                  <SelectTrigger className="h-8.5 text-xs bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value={CurrencyCode.UAH}>Гривня (UAH ₴)</SelectItem>
                    <SelectItem value={CurrencyCode.USD}>Долар (USD $)</SelectItem>
                    <SelectItem value={CurrencyCode.EUR}>Євро (EUR €)</SelectItem>
                    <SelectItem value={CurrencyCode.PLN}>Злотий (PLN zł)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Базова націнка (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={defaultMarginPercent}
                  onChange={(e) => setDefaultMarginPercent(Number(e.target.value))}
                  className="h-8.5 text-xs font-mono bg-background/80"
                  data-testid="supplier-margin-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-card z-10 px-0 py-3 border-t border-border/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs"
            >
              {t('common:cancel', { defaultValue: 'Скасувати' })}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs gap-1.5"
              data-testid="save-supplier-dialog-btn"
            >
              {isSubmitting ? 'Збереження...' : t('common:save', { defaultValue: 'Зберегти' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
