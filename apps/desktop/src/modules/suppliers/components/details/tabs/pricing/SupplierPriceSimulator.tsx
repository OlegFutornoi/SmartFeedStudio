import React, { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  SupplierPricingRuleDto,
  PriceRoundingMode,
  calculateBaseSellingPrice,
  applyPriceRounding,
} from '@smartfeed/shared';

interface SupplierPriceSimulatorProps {
  globalMargin: number;
  globalFixed: number;
  rules: SupplierPricingRuleDto[];
  roundingMode?: PriceRoundingMode;
}

export const SupplierPriceSimulator: React.FC<SupplierPriceSimulatorProps> = ({
  globalMargin,
  globalFixed,
  rules,
  roundingMode = PriceRoundingMode.NONE,
}) => {
  const [simCost, setSimCost] = useState<number>(500);

  const simulation = useMemo(() => {
    const baseCalc = calculateBaseSellingPrice({
      costPrice: simCost,
      defaultMarginPercent: globalMargin,
      defaultFixedMarkup: globalFixed,
      rules: rules.map((r) => ({
        id: r.id,
        minPrice: r.minPrice,
        maxPrice: r.maxPrice,
        marginPercent: r.marginPercent,
        fixedMarkup: r.fixedMarkup,
        isActive: r.isActive,
      })),
    });
    const finalPrice = applyPriceRounding(baseCalc.sellingPrice, roundingMode);
    return {
      ...baseCalc,
      sellingPrice: finalPrice,
    };
  }, [simCost, globalMargin, globalFixed, rules, roundingMode]);

  return (
    <Card className="border-border/80 bg-card shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          Live Симулятор розрахунку ціни
        </CardTitle>
        <CardDescription className="text-xs">
          Введіть вхідну собівартість та подивіться результат
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">
            Вхідна ціна постачальника (₴):
          </label>
          <Input
            type="number"
            min="0"
            value={simCost}
            onChange={(e) => setSimCost(Number(e.target.value))}
            className="h-9 text-base font-bold font-mono text-primary"
            data-testid="simulator-cost-input"
          />
        </div>

        <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Застосоване правило:</span>
            <Badge variant="outline" className="text-2xs font-mono">
              {simulation.matchedRuleType === 'PRICE_BRACKET' ? 'Діапазон цін' : 'Базова націнка'}
            </Badge>
          </div>
          {roundingMode && roundingMode !== PriceRoundingMode.NONE && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Крок округлення:</span>
              <Badge variant="secondary" className="text-2xs font-mono">
                {roundingMode}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Підсумкова націнка:</span>
            <span className="font-semibold text-foreground">
              +{simulation.appliedMarginPercent}%{' '}
              {simulation.appliedFixedMarkup ? `+${simulation.appliedFixedMarkup}₴` : ''}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Маржинальний дохід:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              +{(simulation.sellingPrice - simCost).toFixed(2)} ₴
            </span>
          </div>
          <div className="pt-2 border-t border-border/70 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Вихідна ціна продажу:</span>
            <span
              className="text-lg font-bold font-mono text-primary"
              data-testid="simulated-selling-price"
            >
              {simulation.sellingPrice.toFixed(2)} ₴
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
