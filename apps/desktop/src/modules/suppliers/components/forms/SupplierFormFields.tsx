import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink } from 'lucide-react';
import { SupplierAvatarPicker } from '@/modules/suppliers/components/forms/SupplierAvatarPicker';
import { SupplierCompanyFields } from '@/modules/suppliers/components/forms/SupplierCompanyFields';
import { SupplierManagerFields } from '@/modules/suppliers/components/forms/SupplierManagerFields';
import { SupplierLocationFields } from '@/modules/suppliers/components/forms/SupplierLocationFields';
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
  legalName: string;
  setLegalName: (v: string) => void;
  taxId: string;
  setTaxId: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  segment: string;
  setSegment: (v: string) => void;
  managerName: string;
  setManagerName: (v: string) => void;
  managerPosition: string;
  setManagerPosition: (v: string) => void;
  managerPhone: string;
  setManagerPhone: (v: string) => void;
  managerEmail: string;
  setManagerEmail: (v: string) => void;
  managerTelegram: string;
  setManagerTelegram: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  postcode: string;
  setPostcode: (v: string) => void;
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
  legalName,
  setLegalName,
  taxId,
  setTaxId,
  industry,
  setIndustry,
  segment,
  setSegment,
  managerName,
  setManagerName,
  managerPosition,
  setManagerPosition,
  managerPhone,
  setManagerPhone,
  managerEmail,
  setManagerEmail,
  managerTelegram,
  setManagerTelegram,
  country,
  setCountry,
  city,
  setCity,
  address,
  setAddress,
  postcode,
  setPostcode,
  isSubmitting = false,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const handleOpenWebsite = () => {
    if (!website) return;
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      {/* 1. Smart Avatar & Auto-Logo Discovery */}
      <SupplierAvatarPicker
        logoUrl={logoUrl}
        name={name}
        website={website}
        onChange={setLogoUrl}
        disabled={isSubmitting}
      />

      {/* 2. Basic Identification & Brand */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('suppliers:basicInfo', { defaultValue: 'Основна інформація' })}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium text-foreground block mb-1">
              {t('suppliers:columnName', { defaultValue: 'Назва постачальника' })} *
            </Label>
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
            <Label className="text-xs font-medium text-foreground block mb-1">
              {t('suppliers:formCode', { defaultValue: 'Системний код' })} *
            </Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BRAIN"
              className="h-8.5 text-xs font-mono uppercase bg-background/80"
              data-testid="supplier-code-input"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-foreground block mb-1">
              {t('common:website', { defaultValue: 'Вебсайт' })}
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://brain.com.ua"
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
                  title={t('common:openLink', { defaultValue: 'Відкрити сайт' })}
                  data-testid="open-supplier-website-btn"
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Company & Business Details (CRM) */}
      <SupplierCompanyFields
        legalName={legalName}
        setLegalName={setLegalName}
        taxId={taxId}
        setTaxId={setTaxId}
        industry={industry}
        setIndustry={setIndustry}
        segment={segment}
        setSegment={setSegment}
      />

      {/* 4. Manager & Direct Contacts (CRM) */}
      <SupplierManagerFields
        managerName={managerName}
        setManagerName={setManagerName}
        managerPosition={managerPosition}
        setManagerPosition={setManagerPosition}
        managerPhone={managerPhone}
        setManagerPhone={setManagerPhone}
        managerEmail={managerEmail}
        setManagerEmail={setManagerEmail}
        managerTelegram={managerTelegram}
        setManagerTelegram={setManagerTelegram}
        contactPhone={contactPhone}
        setContactPhone={setContactPhone}
        contactEmail={contactEmail}
        setContactEmail={setContactEmail}
      />

      {/* 5. Warehouse & Physical Address */}
      <SupplierLocationFields
        country={country}
        setCountry={setCountry}
        city={city}
        setCity={setCity}
        address={address}
        setAddress={setAddress}
        postcode={postcode}
        setPostcode={setPostcode}
      />

      {/* 6. Notes & Collaboration Conditions */}
      <div className="space-y-1.5 pt-2 border-t border-border/60">
        <Label className="text-xs font-medium text-foreground block">
          {t('common:description', { defaultValue: 'Примітки та умови співпраці' })}
        </Label>
        <Textarea
          value={notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
          placeholder={t('suppliers:notesPlaceholder', {
            defaultValue: 'Графік відвантажень, мінімальне замовлення, повернення...',
          })}
          rows={3}
          className="w-full rounded-md border border-input px-3 py-2 text-xs bg-background/80 resize-none ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="supplier-notes-input"
        />
      </div>
    </div>
  );
};
