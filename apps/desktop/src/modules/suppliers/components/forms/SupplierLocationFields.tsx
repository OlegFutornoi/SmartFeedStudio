import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { useTranslation } from '@/i18n';

export interface SupplierLocationFieldsProps {
  country: string;
  setCountry: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  postcode: string;
  setPostcode: (v: string) => void;
}

export const SupplierLocationFields: React.FC<SupplierLocationFieldsProps> = ({
  country,
  setCountry,
  city,
  setCity,
  address,
  setAddress,
  postcode,
  setPostcode,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <div className="space-y-3 pt-2 border-t border-border/60">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <MapPin className="size-3.5 text-primary" />
        {t('suppliers:warehouseLocation', { defaultValue: 'Склад та адреса відвантажень' })}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:country', { defaultValue: 'Країна' })}
          </Label>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Україна"
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-country-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:city', { defaultValue: 'Місто' })}
          </Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Київ"
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-city-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:address', { defaultValue: 'Адреса складу / відділення' })}
          </Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="вул. Васильківська, 34"
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-address-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:postcode', { defaultValue: 'Поштовий індекс' })}
          </Label>
          <Input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="03022"
            className="h-8.5 text-xs font-mono bg-background/80"
            data-testid="supplier-postcode-input"
          />
        </div>
      </div>
    </div>
  );
};
