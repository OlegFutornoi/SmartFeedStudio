import { useState, useEffect } from 'react';
import {
  SupplierDto,
  CreateSupplierDto,
  CurrencyCode,
  ExchangeRateMode,
  PriceRoundingMode,
} from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

export interface UseSupplierFormStateOptions {
  supplierToEdit?: SupplierDto | null;
  isOpen: boolean;
  onSave: (payload: CreateSupplierDto) => Promise<void>;
  onClose: () => void;
}

export function useSupplierFormState({
  supplierToEdit,
  isOpen,
  onSave,
  onClose,
}: UseSupplierFormStateOptions) {
  const { t } = useTranslation(['suppliers']);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>(CurrencyCode.UAH);

  // CRM: Company & Business metadata
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industry, setIndustry] = useState('');
  const [segment, setSegment] = useState('');

  // CRM: Manager & Direct contact
  const [managerName, setManagerName] = useState('');
  const [managerPosition, setManagerPosition] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerTelegram, setManagerTelegram] = useState('');

  // CRM: Warehouse & Shipping address
  const [country, setCountry] = useState('Україна');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');

  const [isExpanded, setIsExpanded] = useState(false);
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

      setLegalName(supplierToEdit.legalName || '');
      setTaxId(supplierToEdit.taxId || '');
      setIndustry(supplierToEdit.industry || '');
      setSegment(supplierToEdit.segment || '');

      setManagerName(supplierToEdit.managerName || '');
      setManagerPosition(supplierToEdit.managerPosition || '');
      setManagerPhone(supplierToEdit.managerPhone || '');
      setManagerEmail(supplierToEdit.managerEmail || '');
      setManagerTelegram(supplierToEdit.managerTelegram || '');

      setCountry(supplierToEdit.country || 'Україна');
      setCity(supplierToEdit.city || '');
      setAddress(supplierToEdit.address || '');
      setPostcode(supplierToEdit.postcode || '');
    } else {
      setName('');
      setCode('');
      setContactPhone('');
      setContactEmail('');
      setWebsite('');
      setNotes('');
      setLogoUrl(null);
      setBaseCurrency(CurrencyCode.UAH);

      setLegalName('');
      setTaxId('');
      setIndustry('');
      setSegment('');

      setManagerName('');
      setManagerPosition('');
      setManagerPhone('');
      setManagerEmail('');
      setManagerTelegram('');

      setCountry('Україна');
      setCity('');
      setAddress('');
      setPostcode('');
    }
    setError(null);
    if (!isOpen) setIsExpanded(false);
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

    const sanitizePhone = (val?: string) => {
      if (!val) return undefined;
      const trimmed = val.trim();
      return /\d/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 3 ? trimmed : undefined;
    };

    try {
      await onSave({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPhone: sanitizePhone(contactPhone),
        contactEmail: contactEmail.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        logoUrl: logoUrl || undefined,
        legalName: legalName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        industry: industry.trim() || undefined,
        segment: segment.trim() || undefined,
        managerName: managerName.trim() || undefined,
        managerPosition: managerPosition.trim() || undefined,
        managerPhone: sanitizePhone(managerPhone),
        managerEmail: managerEmail.trim() || undefined,
        managerTelegram: managerTelegram.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        postcode: postcode.trim() || undefined,
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

  return {
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
    isExpanded,
    setIsExpanded,
    isSubmitting,
    error,
    isEdit,
    handleNameChange,
    handleSubmit,
  };
}
