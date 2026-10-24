import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  PriceRoundingMode,
  applyPriceRounding,
  buildCustomRoundingRule,
  type CustomRoundingRuleDto,
  type CustomRoundingRuleType,
} from '@smartfeed/shared';
import { ROUNDING_OPTIONS } from '@/modules/suppliers/components/details/tabs/currencies/useSupplierCurrenciesState';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface PriceRoundingSelectProps {
  value: PriceRoundingMode | string;
  onChange: (val: PriceRoundingMode | string) => void;
  customRules: CustomRoundingRuleDto[];
  onAddCustomRule: (type: CustomRoundingRuleType, rawValue: number) => Promise<void>;
  onDeleteCustomRule: (code: string) => Promise<void>;
}

const CUSTOM_TYPES: Array<[CustomRoundingRuleType, string, string]> = [
  ['DECIMAL', 'suppliers:customRoundingTypeDecimal', '.XX (копійки)'],
  ['INTEGER_ENDING', 'suppliers:customRoundingTypeEnding', 'на X (ціле)'],
  ['MULTIPLE', 'suppliers:customRoundingTypeMultiple', 'кратне X'],
];

export const PriceRoundingSelect: React.FC<PriceRoundingSelectProps> = ({
  value,
  onChange,
  customRules,
  onAddCustomRule,
  onDeleteCustomRule,
}) => {
  const { t, language } = useTranslation(['suppliers', 'common']);
  const [open, setOpen] = useState(false);
  const [customType, setCustomType] = useState<CustomRoundingRuleType>('DECIMAL');
  const [customValue, setCustomValue] = useState<string>('49');

  const isEn = language === 'en';

  const options = useMemo(() => {
    const builtIn = ROUNDING_OPTIONS.map(([code, key, fallback]) => ({
      code: String(code),
      label: t(key, { defaultValue: fallback }),
      isCustom: false,
    }));

    const custom = (customRules || []).map((rule) => {
      const generated = buildCustomRoundingRule(rule.type, rule.value);
      return {
        code: rule.code,
        label: isEn
          ? rule.labelEn || generated.labelEn || rule.code
          : rule.labelUk || generated.labelUk || rule.code,
        isCustom: true,
      };
    });

    return [...builtIn, ...custom];
  }, [customRules, isEn, t]);

  const selectedOption = useMemo(() => {
    return options.find((o) => o.code === value) || options[0];
  }, [options, value]);

  const previewRule = useMemo(() => {
    const num = Number(customValue);
    return buildCustomRoundingRule(customType, Number.isFinite(num) ? num : 0);
  }, [customType, customValue]);

  const previewAmount = useMemo(() => {
    return applyPriceRounding(483.4, previewRule.code);
  }, [previewRule.code]);

  const handleAdd = async () => {
    const num = Number(customValue);
    if (customValue.trim() === '' || Number.isNaN(num) || num < 0) return;
    await onAddCustomRule(customType, num);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-testid="price-rounding-select"
          className="h-8 w-full justify-between px-3 text-xs font-normal bg-background hover:bg-background"
        >
          <span className="truncate">{selectedOption?.label}</span>
          <ChevronDown className="size-3.5 opacity-50 shrink-0 ml-1.5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[340px] p-1.5 z-[110]"
        data-testid="price-rounding-popover"
      >
        <div className="max-h-56 overflow-y-auto space-y-0.5" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.code === value;
            const roundedSample = applyPriceRounding(483.4, opt.code);
            return (
              <div
                key={opt.code}
                role="option"
                aria-selected={isSelected}
                data-testid={`rounding-option-${opt.code}`}
                onClick={() => {
                  onChange(opt.code);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-xs cursor-pointer select-none transition-colors',
                  isSelected
                    ? 'bg-primary/10 text-foreground font-medium'
                    : 'hover:bg-accent text-foreground',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Check
                    className={cn(
                      'size-3.5 shrink-0 text-primary',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 py-0 rounded-sm text-[10px] font-mono tabular-nums text-muted-foreground bg-muted/20 border-border/50"
                  >
                    {roundedSample.toFixed(2)} ₴
                  </Badge>
                  {opt.isCustom && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-testid={`delete-rounding-rule-${opt.code}`}
                      title={t('common:delete')}
                      onClick={(e) => {
                        e.stopPropagation();
                        void onDeleteCustomRule(opt.code);
                      }}
                      className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border/50 mt-1.5 pt-2 px-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-foreground">
              {t('suppliers:addCustomRoundingTitle')}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
              483.40 ₴ ➔ <strong className="text-foreground">{previewAmount.toFixed(2)} ₴</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {CUSTOM_TYPES.map(([typeKey, labelKey, fallback]) => (
              <Button
                key={typeKey}
                type="button"
                variant="outline"
                size="sm"
                data-testid={`custom-rounding-type-${typeKey}`}
                onClick={() => {
                  setCustomType(typeKey);
                  if (typeKey === 'DECIMAL') setCustomValue('49');
                  else if (typeKey === 'INTEGER_ENDING') setCustomValue('0');
                  else setCustomValue('10');
                }}
                className={cn(
                  'h-5 px-1.5 py-0 rounded-sm text-[10px] transition-colors',
                  customType === typeKey
                    ? 'bg-card border-foreground/30 text-foreground font-semibold'
                    : 'bg-muted/15 border-border/50 text-muted-foreground hover:text-foreground',
                )}
              >
                {t(labelKey, { defaultValue: fallback })}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={customType === 'MULTIPLE' ? 1 : 0}
              max={customType === 'DECIMAL' ? 99 : 9999}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
              spellCheck={false}
              autoComplete="off"
              placeholder={customType === 'DECIMAL' ? '49' : customType === 'MULTIPLE' ? '10' : '0'}
              className="h-7 text-xs font-mono tabular-nums bg-background"
              data-testid="custom-rounding-value-input"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => void handleAdd()}
              className="h-7 px-2.5 text-xs gap-1 shrink-0"
              data-testid="add-custom-rounding-btn"
            >
              <Plus className="size-3" />
              {t('suppliers:addCustomRoundingBtn')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
