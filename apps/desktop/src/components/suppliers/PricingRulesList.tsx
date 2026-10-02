import React from 'react';
import { Layers, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SupplierPricingRuleDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface PricingRulesListProps {
  rules: SupplierPricingRuleDto[];
  defaultMarginPercent: number;
  defaultFixedMarkup: number;
  onDeleteRule: (ruleId: string) => void;
}

export const PricingRulesList: React.FC<PricingRulesListProps> = ({
  rules,
  defaultMarginPercent,
  defaultFixedMarkup,
  onDeleteRule,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div className="mt-4 space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Layers className="size-3.5 text-primary" />
          Активні правила націнки ({rules.length})
        </h4>
        <span className="text-[11px] text-muted-foreground">
          Базова націнка: +{defaultMarginPercent}% +{defaultFixedMarkup} ₴
        </span>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-secondary/10">
          Спеціальних правил ще немає. Застосовується базова націнка постачальника.
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-3 rounded-lg bg-card border border-border/80 flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {rule.categoryId ? (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 shrink-0 font-medium"
                  >
                    <Tag className="size-3 mr-1" />
                    Категорія: {rule.categoryNameUk || rule.categoryId}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-secondary text-secondary-foreground border-border shrink-0 font-mono"
                  >
                    Діапазон: {rule.minPrice != null ? `${rule.minPrice} ₴` : '0'} —{' '}
                    {rule.maxPrice != null ? `${rule.maxPrice} ₴` : '∞'}
                  </Badge>
                )}

                <span className="font-semibold text-foreground font-mono">
                  +{rule.marginPercent}% {rule.fixedMarkup > 0 && `+${rule.fixedMarkup} ₴`}
                </span>

                <span className="text-[10px] text-muted-foreground ml-auto pr-2">
                  Пріоритет: {rule.priority}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteRule(rule.id)}
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                title={t('common:delete', { defaultValue: 'Видалити' })}
                data-testid={`delete-pricing-rule-${rule.id}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
