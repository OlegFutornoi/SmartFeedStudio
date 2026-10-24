import React from 'react';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { SupplierPricingRuleDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface SupplierPricingRuleRowProps {
  rule: SupplierPricingRuleDto;
  isMatched: boolean;
  isEditing: boolean;
  onToggleActive: (rule: SupplierPricingRuleDto) => void;
  onEdit: (rule: SupplierPricingRuleDto) => void;
  onDelete: (ruleId: string) => void;
  onSelectForSimulation: (rule: SupplierPricingRuleDto) => void;
}

export const SupplierPricingRuleRow: React.FC<SupplierPricingRuleRowProps> = ({
  rule,
  isMatched,
  isEditing,
  onToggleActive,
  onEdit,
  onDelete,
  onSelectForSimulation,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const min = rule.minPrice ?? 0;
  const max = rule.maxPrice;
  const sampleCost = max != null ? Math.round((min + max) / 2) : Math.max(min + 500, 1000);
  const sampleBaseCost = sampleCost > 0 ? sampleCost : 500;
  const sampleSelling = Math.round(
    sampleBaseCost * (1 + (rule.marginPercent || 0) / 100) + (rule.fixedMarkup || 0),
  );

  return (
    <TableRow
      data-testid={`pricing-rule-row-${rule.id}`}
      data-matched={isMatched ? 'true' : 'false'}
      onClick={() => onSelectForSimulation(rule)}
      title={t('suppliers:ruleClickToTestTooltip', {
        defaultValue: 'Натисніть, щоб підставити цей діапазон у симулятор',
      })}
      className={`group h-9 cursor-pointer transition-colors ${
        !rule.isActive
          ? 'opacity-50 bg-muted/10'
          : isMatched
            ? 'bg-muted/40'
            : isEditing
              ? 'bg-muted/30'
              : 'hover:bg-muted/20'
      }`}
    >
      <TableCell
        className="px-3 py-1.5 w-12"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Switch
          checked={rule.isActive}
          onCheckedChange={() => onToggleActive(rule)}
          aria-label={t('suppliers:ruleToggleAria', {
            defaultValue: 'Увімкнути або вимкнути правило',
          })}
          data-testid={`pricing-rule-toggle-${rule.id}`}
        />
      </TableCell>

      <TableCell className="px-3 py-1.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {rule.categoryNameUk && (
            <Badge variant="outline" className="rounded-sm text-2xs font-normal truncate max-w-32">
              {rule.categoryNameUk}
            </Badge>
          )}
          <span className="font-mono tabular-nums text-foreground">
            {rule.minPrice != null ? `${rule.minPrice}\u00A0₴` : '0\u00A0₴'} —{' '}
            {rule.maxPrice != null ? `${rule.maxPrice}\u00A0₴` : '∞'}
          </span>
          {isMatched && rule.isActive && (
            <Badge
              variant="outline"
              className="rounded-sm text-2xs px-1.5 py-0 bg-success/15 text-success border-success/30"
              data-testid={`pricing-rule-matched-badge-${rule.id}`}
            >
              {t('suppliers:ruleMatchedBadge', { defaultValue: 'Спрацьовує' })}
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="px-3 py-1.5 text-center font-mono tabular-nums text-xs">
        <span className="font-semibold text-success">
          +{rule.marginPercent}%{rule.fixedMarkup ? ` +${rule.fixedMarkup}\u00A0₴` : ''}
        </span>
      </TableCell>

      <TableCell className="px-3 py-1.5 text-center font-mono tabular-nums text-2xs text-muted-foreground hidden sm:table-cell">
        <span className="inline-flex items-center gap-1">
          <span>{sampleBaseCost}&nbsp;₴</span>
          <ArrowRight className="size-2.5 text-muted-foreground" />
          <span className="text-foreground font-medium">{sampleSelling}&nbsp;₴</span>
        </span>
      </TableCell>

      <TableCell
        className="px-3 py-1.5 text-right"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="inline-flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(rule)}
            aria-label={t('suppliers:ruleEditAria', { defaultValue: 'Редагувати правило' })}
            title={t('suppliers:ruleEditAria', { defaultValue: 'Редагувати правило' })}
            className="size-7 text-muted-foreground hover:text-foreground"
            data-testid={`pricing-rule-edit-${rule.id}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(rule.id)}
            aria-label={t('suppliers:ruleDeleteAria', { defaultValue: 'Видалити правило' })}
            title={t('suppliers:ruleDeleteAria', { defaultValue: 'Видалити правило' })}
            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            data-testid={`pricing-rule-delete-${rule.id}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
