import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import type { SupplierSyncSettingDto, UpdateSupplierSyncSettingDto } from '@smartfeed/shared';

interface SupplierSyncScheduleCardProps {
  settings: SupplierSyncSettingDto;
  onChange: (patch: UpdateSupplierSyncSettingDto) => void;
}

export const SupplierSyncScheduleCard: React.FC<SupplierSyncScheduleCardProps> = ({
  settings,
  onChange,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <Card className="border-border/80 shadow-xs" data-testid="supplier-sync-schedule-card">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          {t('suppliers:scheduleCardTitle', { defaultValue: 'Розклад автосинхронізації' })}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('suppliers:scheduleCardDesc', {
            defaultValue: 'Періодичність автоматичного опитування джерел фідів у фоновому режимі',
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="max-w-md space-y-1.5">
          <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            <span>
              {t('suppliers:syncIntervalLabel', { defaultValue: 'Інтервал автооновлення' })}
            </span>
          </Label>
          <Select
            value={String(settings.syncIntervalHours ?? 0)}
            onValueChange={(val) => onChange({ syncIntervalHours: Number(val) })}
          >
            <SelectTrigger className="h-8 text-xs bg-background" data-testid="select-sync-interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">
                {t('suppliers:intervalManual', {
                  defaultValue: 'Тільки вручну (Без автооновлення)',
                })}
              </SelectItem>
              <SelectItem value="1">
                {t('suppliers:interval1h', {
                  defaultValue: 'Кожну 1 годину (Висока динаміка цін)',
                })}
              </SelectItem>
              <SelectItem value="3">
                {t('suppliers:interval3h', { defaultValue: 'Кожні 3 години' })}
              </SelectItem>
              <SelectItem value="6">
                {t('suppliers:interval6h', { defaultValue: 'Кожні 6 годин (Рекомендовано)' })}
              </SelectItem>
              <SelectItem value="12">
                {t('suppliers:interval12h', { defaultValue: 'Кожні 12 годин' })}
              </SelectItem>
              <SelectItem value="24">
                {t('suppliers:interval24h', { defaultValue: '1 раз на добу (24 години)' })}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
