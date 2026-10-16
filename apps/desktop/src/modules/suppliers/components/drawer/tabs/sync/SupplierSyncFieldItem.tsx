import React from 'react';
import { ShieldCheck, PlusCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/i18n';

export interface SelectOption {
  value: string;
  label: string;
  badgeType: 'protected' | 'append' | 'overwrite';
}

interface SupplierSyncFieldItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (val: string) => void;
  dataTestId?: string;
}

export const SupplierSyncFieldItem: React.FC<SupplierSyncFieldItemProps> = ({
  icon: Icon,
  label,
  value,
  options,
  onValueChange,
  dataTestId,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const currentOption = options.find((opt) => opt.value === value) || options[0];

  const renderBadge = (type?: 'protected' | 'append' | 'overwrite') => {
    if (type === 'protected') {
      return (
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 text-3xs py-0 gap-1 font-medium shrink-0"
        >
          <ShieldCheck className="size-2.5" />
          <span>{t('suppliers:badgeFieldProtected', { defaultValue: 'Захищено' })}</span>
        </Badge>
      );
    }
    if (type === 'append') {
      return (
        <Badge
          variant="outline"
          className="bg-muted text-foreground border-border text-3xs py-0 gap-1 font-medium shrink-0"
        >
          <PlusCircle className="size-2.5" />
          <span>{t('suppliers:badgeFieldAppend', { defaultValue: 'Доповнення' })}</span>
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground border-border/80 text-3xs py-0 gap-1 font-medium shrink-0"
      >
        <RefreshCw className="size-2.5" />
        <span>{t('suppliers:badgeFieldOverwrite', { defaultValue: 'Перезапис' })}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-1.5 p-2.5 rounded-lg border border-border/50 bg-background/60 hover:border-border transition-colors">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-foreground flex items-center gap-1.5 min-w-0">
          <Icon className="size-3.5 text-primary shrink-0" />
          <span className="truncate">{label}</span>
        </Label>
        {renderBadge(currentOption?.badgeType)}
      </div>

      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 text-xs bg-background shadow-2xs" data-testid={dataTestId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center justify-between gap-2 w-full text-xs">
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
