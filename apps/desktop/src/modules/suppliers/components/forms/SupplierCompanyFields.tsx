import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

export interface SupplierCompanyFieldsProps {
  legalName: string;
  setLegalName: (v: string) => void;
  taxId: string;
  setTaxId: (v: string) => void;
  industry: string;
  setIndustry: (v: string) => void;
  segment: string;
  setSegment: (v: string) => void;
}

export const SupplierCompanyFields: React.FC<SupplierCompanyFieldsProps> = ({
  legalName,
  setLegalName,
  taxId,
  setTaxId,
  industry,
  setIndustry,
  segment,
  setSegment,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <div className="space-y-3 pt-2 border-t border-border/60">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Building2 className="size-3.5 text-primary" />
        {t('suppliers:companyDetails', { defaultValue: 'Дані компанії та реквізити' })}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:legalName', { defaultValue: 'Юридична назва' })}
          </Label>
          <Input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder={t('suppliers:legalNamePlaceholder', {
              defaultValue: 'напр. ТОВ «Брейн Дистрибʼюшн»',
            })}
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-legal-name-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:taxId', { defaultValue: 'Код ЄДРПОУ / ІПН' })}
          </Label>
          <Input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder={t('suppliers:taxIdPlaceholder', { defaultValue: 'напр. 30370505' })}
            className="h-8.5 text-xs font-mono bg-background/80"
            data-testid="supplier-tax-id-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:industry', { defaultValue: 'Галузь бізнесу' })}
          </Label>
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder={t('suppliers:industryPlaceholder', {
              defaultValue: 'напр. Електроніка та IT-обладнання',
            })}
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-industry-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:segment', { defaultValue: 'Сегмент співпраці' })}
          </Label>
          <Input
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            placeholder={t('suppliers:segmentPlaceholder', {
              defaultValue: 'напр. Офіційний дистрибʼютор',
            })}
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-segment-input"
          />
        </div>
      </div>
    </div>
  );
};
