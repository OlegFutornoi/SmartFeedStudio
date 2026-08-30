import React from 'react';
import { Calculator, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FullPriceSimulationResult } from '@smartfeed/shared';

interface MarginEconomicsSimulatorProps {
  simCostPrice: number;
  simSupplierMargin: number;
  commissionPercent: string;
  extraFixedCost: string;
  applyReverseMarkup: boolean;
  simulation: FullPriceSimulationResult;
  onCostPriceChange: (val: number) => void;
  onSupplierMarginChange: (val: number) => void;
}

export const MarginEconomicsSimulator: React.FC<MarginEconomicsSimulatorProps> = ({
  simCostPrice,
  simSupplierMargin,
  commissionPercent,
  extraFixedCost,
  applyReverseMarkup,
  simulation,
  onCostPriceChange,
  onSupplierMarginChange,
}) => {
  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Calculator className="size-4 text-primary" />
          <span>Симулятор маржинальності та чистого заробітку</span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20"
        >
          {applyReverseMarkup ? 'Reverse Mode (100% захист)' : 'Direct Mode'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <Label className="text-[10px] text-muted-foreground">Собівартість (₴)</Label>
          <Input
            type="number"
            value={simCostPrice}
            onChange={(e) => onCostPriceChange(Number(e.target.value) || 0)}
            className="h-7 text-xs font-mono mt-0.5"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Вхідна маржа (%)</Label>
          <Input
            type="number"
            value={simSupplierMargin}
            onChange={(e) => onSupplierMarginChange(Number(e.target.value) || 0)}
            className="h-7 text-xs font-mono mt-0.5"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Комісія маркетплейсу</Label>
          <div className="h-7 text-xs font-mono flex items-center px-2 rounded-md bg-background border border-border/60 mt-0.5">
            {commissionPercent || 0}%
          </div>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Дод. витрати</Label>
          <div className="h-7 text-xs font-mono flex items-center px-2 rounded-md bg-background border border-border/60 mt-0.5">
            +{extraFixedCost || 0} ₴
          </div>
        </div>
      </div>

      {/* Economics Breakdown */}
      <div className="p-3 rounded-lg bg-background border border-border/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div>
          <span className="text-[10px] text-muted-foreground block">Базова ціна (дохід)</span>
          <span className="text-xs font-bold font-mono text-foreground mt-0.5 block">
            {simulation.basePrice} ₴
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Ціна на полиці (фід)</span>
          <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5 block">
            {simulation.shelfPrice} ₴
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Комісія сайту</span>
          <span className="text-xs font-bold font-mono text-destructive mt-0.5 block">
            -{simulation.commissionAmount} ₴
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block">Ваш чистий заробіток</span>
          <span className="text-xs font-bold font-mono text-primary mt-0.5 flex items-center justify-center gap-1">
            <Sparkles className="size-3" />+{simulation.netProfit} ₴ ({simulation.netMarginPercent}
            %)
          </span>
        </div>
      </div>
    </div>
  );
};
