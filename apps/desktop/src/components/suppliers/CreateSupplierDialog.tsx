import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Percent, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierDto, CreateSupplierDto } from '@smartfeed/shared';
import { useTranslation, getErrorMessage } from '@/i18n';

interface CreateSupplierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSupplierDto) => Promise<void>;
  initialData?: SupplierDto | null;
}

export function CreateSupplierDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CreateSupplierDialogProps) {
  const { t } = useTranslation(['suppliers', 'common', 'errors']);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [defaultMarginPercent, setDefaultMarginPercent] = useState<number>(0);
  const [defaultFixedMarkup, setDefaultFixedMarkup] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setContactPhone(initialData.contactPhone || '');
      setContactEmail(initialData.contactEmail || '');
      setWebsite(initialData.website || '');
      setNotes(initialData.notes || '');
      setDefaultMarginPercent(initialData.defaultMarginPercent || 0);
      setDefaultFixedMarkup(initialData.defaultFixedMarkup || 0);
      setIsActive(initialData.isActive ?? true);
    } else {
      setName('');
      setCode('');
      setContactPhone('');
      setContactEmail('');
      setWebsite('');
      setNotes('');
      setDefaultMarginPercent(0);
      setDefaultFixedMarkup(0);
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('suppliers:nameRequired'));
      return;
    }
    if (!code.trim()) {
      setError(t('suppliers:codeRequired'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        defaultMarginPercent: Number(defaultMarginPercent) || 0,
        defaultFixedMarkup: Number(defaultFixedMarkup) || 0,
        isActive,
      });
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {initialData ? t('suppliers:editSupplier') : t('suppliers:createModalTitle')}
              </h2>
              <p className="text-xs text-muted-foreground">{t('suppliers:createModalDesc')}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t('suppliers:nameLabel')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('suppliers:namePlaceholder')}
                className="w-full bg-secondary/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t('suppliers:codeLabel')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('suppliers:codePlaceholder')}
                className="w-full bg-secondary/40 border border-border/80 rounded-xl px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Pricing Markup Section */}
          <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/60 space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="size-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                {t('suppliers:pricingRulesTitle')}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{t('suppliers:pricingRulesDesc')}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  {t('suppliers:marginPercent')} (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.5"
                  value={defaultMarginPercent}
                  onChange={(e) => setDefaultMarginPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  {t('suppliers:fixedMarkup')} (₴)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={defaultFixedMarkup}
                  onChange={(e) => setDefaultFixedMarkup(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Contacts Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t('suppliers:phoneLabel')}
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+380..."
                className="w-full bg-secondary/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {t('suppliers:emailLabel')}
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="supplier@..."
                className="w-full bg-secondary/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t('suppliers:websiteLabel')}
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full bg-secondary/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {t('suppliers:notesLabel')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('suppliers:notesPlaceholder', {
                defaultValue: 'Додаткові деталі або умови співпраці...',
              })}
              className="w-full bg-secondary/40 border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs shadow-md shadow-primary/25"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('suppliers:saving') : t('suppliers:saveButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
