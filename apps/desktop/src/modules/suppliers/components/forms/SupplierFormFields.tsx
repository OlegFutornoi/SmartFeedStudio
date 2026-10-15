import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink } from 'lucide-react';
import { CurrencyCode } from '@smartfeed/shared';
import { SupplierAvatarPicker } from '@/modules/suppliers/components/forms/SupplierAvatarPicker';
import { useTranslation } from '@/i18n';

export interface SupplierFormFieldsProps {
  name: string;
  setName: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  logoUrl: string | null;
  setLogoUrl: (v: string | null) => void;
  baseCurrency: CurrencyCode;
  setBaseCurrency: (v: CurrencyCode) => void;
  isSubmitting?: boolean;
}

export const SupplierFormFields: React.FC<SupplierFormFieldsProps> = ({
  name,
  setName,
  code,
  setCode,
  contactPhone,
  setContactPhone,
  contactEmail,
  setContactEmail,
  website,
  setWebsite,
  notes,
  setNotes,
  logoUrl,
  setLogoUrl,
  baseCurrency,
  setBaseCurrency,
  isSubmitting = false,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const handleOpenWebsite = () => {
    if (!website) return;
    const url =
      website.startsWith('http://') || website.startsWith('https://')
        ? website
        : `https://${website}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* 1. Avatar Picker */}
      <SupplierAvatarPicker
        logoUrl={logoUrl}
        name={name}
        onChange={setLogoUrl}
        disabled={isSubmitting}
      />

      {/* 2. Basic Information */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('suppliers:basicInfo', { defaultValue: 'Основна інформація' })}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              {t('suppliers:columnName', { defaultValue: 'Назва постачальника' })} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brain Computers"
              className="h-8.5 text-xs bg-background/80"
              data-testid="supplier-name-input"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              {t('suppliers:formCode', { defaultValue: 'Системний код' })} *
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BRAIN"
              className="h-8.5 text-xs font-mono uppercase bg-background/80"
              data-testid="supplier-code-input"
              required
            />
          </div>
        </div>
      </div>

      {/* 3. Contact Details & Website with direct link */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('suppliers:columnContacts', { defaultValue: 'Контактні дані та сайт' })}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              {t('common:website', { defaultValue: 'Вебсайт' })}
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://supplier.com"
                className="h-8.5 text-xs bg-background/80 flex-1"
                data-testid="supplier-website-input"
              />
              {website && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8.5 shrink-0 text-muted-foreground hover:text-primary cursor-pointer"
                  onClick={handleOpenWebsite}
                  title={t('common:openLink', { defaultValue: 'Відкрити сайт постачальника' })}
                  data-testid="open-supplier-website-btn"
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              {t('suppliers:filterCurrency', { defaultValue: 'Базова валюта прайсу' })}
            </label>
            <Select
              value={baseCurrency}
              onValueChange={(val: CurrencyCode) => setBaseCurrency(val)}
            >
              <SelectTrigger
                className="h-8.5 text-xs bg-background/80"
                data-testid="supplier-currency-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CurrencyCode.UAH}>Гривня (UAH ₴)</SelectItem>
                <SelectItem value={CurrencyCode.USD}>Долар (USD $)</SelectItem>
                <SelectItem value={CurrencyCode.EUR}>Євро (EUR €)</SelectItem>
                <SelectItem value={CurrencyCode.PLN}>Злотий (PLN zł)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              {t('common:phone', { defaultValue: 'Телефон' })}
            </label>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+380..."
              className="h-8.5 text-xs bg-background/80"
              data-testid="supplier-phone-input"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Email</label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="b2b@supplier.ua"
              className="h-8.5 text-xs bg-background/80"
              data-testid="supplier-email-input"
            />
          </div>
        </div>
      </div>

      {/* 4. Notes / Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground block">
          {t('common:description', { defaultValue: 'Примітки та умови роботи' })}
        </label>
        <textarea
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder={t('suppliers:notesPlaceholder', {
            defaultValue: 'Графік відвантажень, мінімальне замовлення, контактні особи...',
          })}
          rows={3}
          className="w-full rounded-md border border-input px-3 py-2 text-xs bg-background/80 resize-none ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="supplier-notes-input"
        />
      </div>
    </div>
  );
};
