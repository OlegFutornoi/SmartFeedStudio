import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { useTranslation } from '@/i18n';

export interface SupplierManagerFieldsProps {
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
  contactPhone: string;
  setContactPhone: (v: string) => void;
  contactEmail: string;
  setContactEmail: (v: string) => void;
}

export const SupplierManagerFields: React.FC<SupplierManagerFieldsProps> = ({
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
  contactPhone,
  setContactPhone,
  contactEmail,
  setContactEmail,
}) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <div className="space-y-3 pt-2 border-t border-border/60">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <User className="size-3.5 text-primary" />
        {t('suppliers:managerDetails', { defaultValue: 'Відповідальний менеджер' })}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:managerName', { defaultValue: 'ПІБ менеджера' })}
          </Label>
          <Input
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder={t('suppliers:managerNamePlaceholder', {
              defaultValue: 'напр. Олександр Коваленко',
            })}
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-manager-name-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:managerPosition', { defaultValue: 'Посада' })}
          </Label>
          <Input
            value={managerPosition}
            onChange={(e) => setManagerPosition(e.target.value)}
            placeholder={t('suppliers:managerPositionPlaceholder', {
              defaultValue: 'напр. B2B Account Manager',
            })}
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-manager-position-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:managerPhone', { defaultValue: 'Прямий телефон' })}
          </Label>
          <Input
            value={managerPhone || contactPhone}
            onChange={(e) => {
              setManagerPhone(e.target.value);
              if (!contactPhone) setContactPhone(e.target.value);
            }}
            placeholder="+380..."
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-manager-phone-input"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:managerEmail', { defaultValue: 'Робочий Email' })}
          </Label>
          <Input
            type="email"
            value={managerEmail || contactEmail}
            onChange={(e) => {
              setManagerEmail(e.target.value);
              if (!contactEmail) setContactEmail(e.target.value);
            }}
            placeholder="b2b@supplier.ua"
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-manager-email-input"
          />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs font-medium text-foreground block mb-1">
            {t('suppliers:managerTelegram', { defaultValue: 'Telegram' })}
          </Label>
          <Input
            value={managerTelegram}
            onChange={(e) => setManagerTelegram(e.target.value)}
            placeholder={t('suppliers:managerTelegramPlaceholder', {
              defaultValue: 'напр. @supplier_b2b',
            })}
            className="h-8.5 text-xs bg-background/80"
            data-testid="supplier-manager-telegram-input"
          />
        </div>
      </div>
    </div>
  );
};
