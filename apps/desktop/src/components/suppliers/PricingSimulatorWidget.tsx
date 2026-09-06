import React from 'react';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCategorySummaryDto, BasePriceCalculationResult } from '@smartfeed/shared';

interface PricingSimulatorWidgetProps {
  testCostPrice: number;
  testCategoryId: string;
  categories: ProductCategorySummaryDto[];
  simulationResult: BasePriceCalculationResult | null;
  onCostPriceChange: (val: number) => void;
  onCategoryChange: (catId: string) => void;
}

export const PricingSimulatorWidget: React.FC<PricingSimulatorWidgetProps> = ({
  testCostPrice,
  testCategoryId,
  categories,
  simulationResult,
  onCostPriceChange,
  onCategoryChange,
}) => {
  return (
    <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Calculator className="size-4 text-primary" />
          Інтерактивний калькулятор вхідної націнки
        </span>
        <Badge
          variant="outline"
          className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20"
        >
          Live Preview
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[11px] text-muted-foreground">
            Собівартість постачальника (₴)
          </Label>
          <Input
            type="number"
            min="0"
            step="1"
            value={testCostPrice}
            onChange={(e) => onCostPriceChange(Number(e.target.value) || 0)}
            className="h-8 text-xs font-mono mt-1"
          />
        </div>

        <div>
          <Label className="text-[11px] text-muted-foreground">Тестова категорія товару</Label>
          <div className="mt-1">
            <Select
              value={testCategoryId || 'none'}
              onValueChange={(val) => onCategoryChange(val === 'none' ? '' : val)}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-background">
                <SelectValue placeholder="(Без категорії / Загальне правило)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  (Без категорії / Загальне правило)
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.nameUk} ({c.productCount} тов.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-background border border-border/80 flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground font-medium">
            Розрахована ціна продажу:
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-bold text-emerald-400 font-mono">
              {simulationResult?.sellingPrice ?? 0} ₴
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              (+{simulationResult ? simulationResult.sellingPrice - simulationResult.costPrice : 0}{' '}
              ₴)
            </span>
          </div>
          <span className="text-[9px] text-primary truncate mt-0.5">
            Правило: {simulationResult?.matchedRuleType || 'DEFAULT'}
          </span>
        </div>
      </div>
    </div>
  );
};
