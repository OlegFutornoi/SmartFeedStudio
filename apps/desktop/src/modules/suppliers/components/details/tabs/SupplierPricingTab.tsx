import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { SupplierDto, SupplierPricingRuleDto } from '@smartfeed/shared';
import {
  getSupplierPricingRules,
  createSupplierPricingRule,
  deleteSupplierPricingRule,
  updateSupplier,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { SupplierPriceSimulator } from '@/modules/suppliers/components/details/tabs/pricing/SupplierPriceSimulator';

interface SupplierPricingTabProps {
  supplier: SupplierDto;
  onRefreshSupplier: () => void;
}

export const SupplierPricingTab: React.FC<SupplierPricingTabProps> = ({
  supplier,
  onRefreshSupplier,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const { token } = useAuth();

  const [rules, setRules] = useState<SupplierPricingRuleDto[]>([]);
  const [globalMargin, setGlobalMargin] = useState<number>(supplier.defaultMarginPercent || 0);
  const [globalFixed, setGlobalFixed] = useState<number>(supplier.defaultFixedMarkup || 0);
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);

  // New Rule form state
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [ruleMargin, setRuleMargin] = useState<string>('20');
  const [ruleFixed, setRuleFixed] = useState<string>('0');

  const loadRules = useCallback(async () => {
    try {
      const data = await getSupplierPricingRules(supplier.id, token || undefined);
      setRules(data || []);
    } catch (err) {
      console.warn('[SupplierPricingTab:loadRules] Error:', err);
    }
  }, [supplier.id, token]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSaveGlobalMarkup = async () => {
    setIsSavingGlobal(true);
    try {
      await updateSupplier(
        supplier.id,
        { defaultMarginPercent: globalMargin, defaultFixedMarkup: globalFixed },
        token || undefined,
      );
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierPricingTab:handleSaveGlobalMarkup] Error:', err);
    } finally {
      setIsSavingGlobal(false);
    }
  };

  const handleAddRule = async () => {
    if (!ruleMargin && !ruleFixed) return;
    try {
      const created = await createSupplierPricingRule(
        supplier.id,
        {
          minPrice: minPrice ? Number(minPrice) : null,
          maxPrice: maxPrice ? Number(maxPrice) : null,
          marginPercent: Number(ruleMargin || 0),
          fixedMarkup: Number(ruleFixed || 0),
          priority: 1,
          isActive: true,
        },
        token || undefined,
      );
      setRules((prev) => [created, ...prev]);
      setMinPrice('');
      setMaxPrice('');
      setRuleMargin('20');
      setRuleFixed('0');
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierPricingTab:handleAddRule] Error:', err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteSupplierPricingRule(supplier.id, ruleId, token || undefined);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
      onRefreshSupplier();
    } catch (err) {
      console.warn('[SupplierPricingTab:handleDeleteRule] Error:', err);
    }
  };

  return (
    <div className="space-y-4" data-testid="supplier-pricing-tab">
      {/* 1. Global Markup Card */}
      <Card className="border-border/80 bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            {t('suppliers:globalMarkupTitle', {
              defaultValue: 'Загальна базова націнка постачальника',
            })}
          </CardTitle>
          <CardDescription className="text-xs">
            {t('suppliers:globalMarkupDesc', {
              defaultValue:
                'Застосовується за замовчуванням до всіх товарів, якщо немає точніших правил',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t('suppliers:pricingMarkupPercent', { defaultValue: 'Націнка:' })}
              </span>
              <Input
                type="number"
                min="0"
                value={globalMargin}
                onChange={(e) => setGlobalMargin(Number(e.target.value))}
                className="w-24 h-8 text-xs font-mono"
                data-testid="base-margin-input"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t('suppliers:pricingFixedMarkup', { defaultValue: '+ Фіксовано:' })}
              </span>
              <Input
                type="number"
                min="0"
                value={globalFixed}
                onChange={(e) => setGlobalFixed(Number(e.target.value))}
                className="w-24 h-8 text-xs font-mono"
                data-testid="base-fixed-markup-input"
              />
              <span className="text-xs text-muted-foreground">₴</span>
            </div>

            <Button
              size="sm"
              onClick={handleSaveGlobalMarkup}
              disabled={isSavingGlobal}
              className="h-8 text-xs ml-auto"
              data-testid="save-global-markup-btn"
            >
              {isSavingGlobal
                ? t('common:saving', { defaultValue: 'Збереження...' })
                : t('common:save', { defaultValue: 'Зберегти' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Interactive Simulator & Add Rule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tiered Price Brackets Rules */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              {t('suppliers:tieredRulesTitle', { defaultValue: 'Діапазони цін (Tiered Brackets)' })}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('suppliers:tieredRulesDesc', {
                defaultValue: 'Націнки залежно від діапазону собівартості товару',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add Rule Form */}
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/70 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    {t('suppliers:ruleMinPrice', { defaultValue: 'Мін. ціна (₴)' })}
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    {t('suppliers:ruleMaxPrice', { defaultValue: 'Макс. ціна (₴)' })}
                  </span>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    {t('suppliers:ruleMarginPercent', { defaultValue: 'Націнка (%)' })}
                  </span>
                  <Input
                    type="number"
                    value={ruleMargin}
                    onChange={(e) => setRuleMargin(e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">
                    {t('suppliers:ruleFixedMarkup', { defaultValue: 'Фіксовано (₴)' })}
                  </span>
                  <Input
                    type="number"
                    value={ruleFixed}
                    onChange={(e) => setRuleFixed(e.target.value)}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
              <Button size="sm" onClick={handleAddRule} className="w-full h-7 text-xs gap-1 mt-1">
                <Plus className="size-3" />
                {t('suppliers:addRuleBtn', { defaultValue: '+ Додати правило діапазону' })}
              </Button>
            </div>

            {/* Rules list */}
            {rules.length > 0 && (
              <div className="border border-border/80 rounded-lg overflow-hidden">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/30">
                    <TableRow className="h-7 hover:bg-transparent">
                      <TableHead className="py-1">
                        {t('suppliers:colCostRange', { defaultValue: 'Діапазон' })}
                      </TableHead>
                      <TableHead className="py-1 text-center">
                        {t('suppliers:colMarkup', { defaultValue: 'Націнка' })}
                      </TableHead>
                      <TableHead className="py-1 text-right pr-2">
                        {t('common:actions', { defaultValue: 'Дія' })}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((r) => (
                      <TableRow key={r.id} className="h-8">
                        <TableCell className="py-1 font-mono text-xs">
                          {r.minPrice != null ? `${r.minPrice}₴` : '0₴'} —{' '}
                          {r.maxPrice != null ? `${r.maxPrice}₴` : '∞'}
                        </TableCell>
                        <TableCell className="py-1 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                          +{r.marginPercent}% {r.fixedMarkup ? `+${r.fixedMarkup}₴` : ''}
                        </TableCell>
                        <TableCell className="py-1 text-right pr-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRule(r.id)}
                            className="size-6 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Simulator Widget */}
        <SupplierPriceSimulator
          globalMargin={globalMargin}
          globalFixed={globalFixed}
          rules={rules}
          roundingMode={supplier.priceRounding}
        />
      </div>
    </div>
  );
};
