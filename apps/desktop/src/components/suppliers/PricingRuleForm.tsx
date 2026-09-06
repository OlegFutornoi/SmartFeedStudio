import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCategorySummaryDto } from '@smartfeed/shared';

interface PricingRuleFormProps {
  categories: ProductCategorySummaryDto[];
  isSubmitting: boolean;
  onSubmit: (dto: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    marginPercent: number;
    fixedMarkup: number;
    priority: number;
    isActive: boolean;
  }) => Promise<void>;
}

export const PricingRuleForm: React.FC<PricingRuleFormProps> = ({
  categories,
  isSubmitting,
  onSubmit,
}) => {
  const [ruleType, setRuleType] = useState<'category' | 'bracket'>('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories.length > 0 ? categories[0].id : '',
  );
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [marginPercent, setMarginPercent] = useState<string>('20');
  const [fixedMarkup, setFixedMarkup] = useState<string>('0');
  const [priority, setPriority] = useState<string>('5');

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      categoryId: ruleType === 'category' ? selectedCategoryId || undefined : undefined,
      minPrice: ruleType === 'bracket' && minPrice !== '' ? Number(minPrice) : undefined,
      maxPrice: ruleType === 'bracket' && maxPrice !== '' ? Number(maxPrice) : undefined,
      marginPercent: Number(marginPercent) || 0,
      fixedMarkup: Number(fixedMarkup) || 0,
      priority: Number(priority) || 0,
      isActive: true,
    });

    setMinPrice('');
    setMaxPrice('');
    setMarginPercent('20');
    setFixedMarkup('0');
    setPriority('5');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 p-4 rounded-xl border border-border bg-card space-y-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Plus className="size-3.5 text-primary" />
          Додати правило націнки
        </h4>
        <div className="flex items-center gap-1 bg-secondary/50 p-0.5 rounded-lg border border-border/50 text-[11px]">
          <button
            type="button"
            onClick={() => setRuleType('category')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              ruleType === 'category'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            За категорією
          </button>
          <button
            type="button"
            onClick={() => setRuleType('bracket')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              ruleType === 'bracket'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            За ціновим діапазоном
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {ruleType === 'category' ? (
          <div className="col-span-1 sm:col-span-2">
            <Label className="text-[11px] text-muted-foreground">Категорія товару</Label>
            <div className="mt-1">
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-full h-8 text-xs bg-background">
                  <SelectValue placeholder="Оберіть категорію..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      Немає створених категорій
                    </div>
                  ) : (
                    categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.nameUk} ({c.productCount} тов.)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <>
            <div>
              <Label className="text-[11px] text-muted-foreground">Мін. собівартість (₴)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-8 text-xs font-mono mt-1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Макс. собівартість (₴)</Label>
              <Input
                type="number"
                min="0"
                placeholder="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-8 text-xs font-mono mt-1"
              />
            </div>
          </>
        )}

        <div>
          <Label className="text-[11px] text-muted-foreground">Націнка (%)</Label>
          <Input
            type="number"
            step="0.5"
            value={marginPercent}
            onChange={(e) => setMarginPercent(e.target.value)}
            className="h-8 text-xs font-mono mt-1"
          />
        </div>

        <div>
          <Label className="text-[11px] text-muted-foreground">Фіксована націнка (+₴)</Label>
          <Input
            type="number"
            step="1"
            value={fixedMarkup}
            onChange={(e) => setFixedMarkup(e.target.value)}
            className="h-8 text-xs font-mono mt-1"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Label className="text-[11px] text-muted-foreground">
            Пріоритет (вищий виконується першим):
          </Label>
          <Input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="h-7 w-16 text-xs font-mono"
          />
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={
            isSubmitting ||
            (ruleType === 'category' && !selectedCategoryId && categories.length > 0)
          }
          className="h-8 text-xs px-4"
          data-testid="submit-pricing-rule-btn"
        >
          <Plus className="size-3.5 mr-1" />
          Зберегти правило
        </Button>
      </div>
    </form>
  );
};
