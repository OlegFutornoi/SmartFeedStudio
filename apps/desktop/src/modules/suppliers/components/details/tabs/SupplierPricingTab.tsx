import React from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '@/components/ui/table';
import type { SupplierDto } from '@smartfeed/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { useSupplierPricingState } from '@/modules/suppliers/components/details/tabs/pricing/useSupplierPricingState';
import { SupplierPricingRuleComposer } from '@/modules/suppliers/components/details/tabs/pricing/SupplierPricingRuleComposer';
import { SupplierPricingRuleRow } from '@/modules/suppliers/components/details/tabs/pricing/SupplierPricingRuleRow';
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

  const {
    rules,
    categories,
    globalMargin,
    setGlobalMargin,
    globalFixed,
    setGlobalFixed,
    isSavingGlobal,
    isSubmittingRule,
    editingRuleId,
    selectedCategoryId,
    setSelectedCategoryId,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    ruleMargin,
    setRuleMargin,
    ruleFixed,
    setRuleFixed,
    hasRangeError,
    hasOverlapWarning,
    simCost,
    setSimCost,
    simCategoryId,
    setSimCategoryId,
    simulation,
    handleSaveGlobalMarkup,
    handleStartEdit,
    handleCancelEdit,
    handleSubmitRule,
    handleToggleRuleActive,
    handleDeleteRule,
    handleApplyDefaultTiers,
    handleSelectRuleForSimulation,
  } = useSupplierPricingState(supplier, token, onRefreshSupplier);

  const activeRulesCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-4" data-testid="supplier-pricing-tab">
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground text-balance">
                {t('suppliers:globalMarkupTitle', {
                  defaultValue: 'Загальна базова націнка постачальника',
                })}
              </h3>
              <Badge
                variant="outline"
                className="rounded-sm text-2xs font-normal text-muted-foreground"
              >
                {t('suppliers:pricingHierarchyHint', {
                  defaultValue:
                    'Порядок розрахунку: 1. Правило категорії ➔ 2. Діапазон ціни ➔ 3. Базова націнка',
                })}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('suppliers:globalMarkupDesc', {
                defaultValue:
                  'Застосовується за замовчуванням до всіх товарів, якщо немає точніших правил',
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {t('suppliers:pricingMarkupPercent', { defaultValue: 'Націнка:' })}
              </span>
              <Input
                type="number"
                min="0"
                autoComplete="off"
                value={globalMargin}
                onChange={(e) => setGlobalMargin(Number(e.target.value))}
                className="w-20 h-8 text-xs font-mono tabular-nums"
                data-testid="base-margin-input"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">
                {t('suppliers:pricingFixedMarkup', { defaultValue: '+ Фіксовано:' })}
              </span>
              <Input
                type="number"
                min="0"
                autoComplete="off"
                value={globalFixed}
                onChange={(e) => setGlobalFixed(Number(e.target.value))}
                className="w-20 h-8 text-xs font-mono tabular-nums"
                data-testid="base-fixed-markup-input"
              />
              <span className="text-xs text-muted-foreground">₴</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveGlobalMarkup}
              disabled={isSavingGlobal}
              className="h-8 text-xs"
              data-testid="save-global-markup-btn"
            >
              {isSavingGlobal
                ? t('common:saving', { defaultValue: 'Збереження…' })
                : t('common:save', { defaultValue: 'Зберегти' })}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <Card className="lg:col-span-7 border-border/60 bg-card shadow-xs overflow-hidden">
          <CardHeader className="pb-2.5 border-b border-border/50 flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground text-balance">
                {t('suppliers:tieredRulesTitle', {
                  defaultValue: 'Діапазони цін (Tiered Brackets)',
                })}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('suppliers:tieredRulesDesc', {
                  defaultValue: 'Націнки залежно від діапазону собівартості товару',
                })}
              </CardDescription>
            </div>
            {rules.length > 0 && (
              <Badge
                variant="outline"
                className="rounded-sm text-2xs font-mono tabular-nums shrink-0"
              >
                {t('suppliers:rulesActiveStat', {
                  active: activeRulesCount,
                  total: rules.length,
                  defaultValue: `Активно: ${activeRulesCount} / ${rules.length}`,
                })}
              </Badge>
            )}
          </CardHeader>

          <SupplierPricingRuleComposer
            categories={categories}
            editingRuleId={editingRuleId}
            selectedCategoryId={selectedCategoryId}
            onSelectCategoryId={setSelectedCategoryId}
            minPrice={minPrice}
            onMinPriceChange={setMinPrice}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            ruleMargin={ruleMargin}
            onRuleMarginChange={setRuleMargin}
            ruleFixed={ruleFixed}
            onRuleFixedChange={setRuleFixed}
            hasRangeError={hasRangeError}
            hasOverlapWarning={hasOverlapWarning}
            isSubmitting={isSubmittingRule}
            onSubmit={handleSubmitRule}
            onCancelEdit={handleCancelEdit}
          />

          <CardContent className="p-0">
            {rules.length === 0 ? (
              <div className="p-6 text-center flex flex-col items-center justify-center space-y-2.5">
                <Layers className="size-7 text-muted-foreground/50" />
                <div className="space-y-1 max-w-md">
                  <p className="text-xs font-semibold text-foreground">
                    {t('suppliers:emptyPricingRulesTitle', {
                      defaultValue: 'Індивідуальні правила та діапазони відсутні',
                    })}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    {t('suppliers:emptyPricingRulesDesc', {
                      defaultValue:
                        'Зараз до всіх товарів діє базова націнка. Створіть діапазон вище або заповніть стандартну роздрібну сітку.',
                    })}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingRule}
                  onClick={handleApplyDefaultTiers}
                  className="h-8 text-xs gap-1.5 mt-1"
                  title={t('suppliers:applyDefaultTiersDesc', {
                    defaultValue:
                      '0–500 ₴ (+35%), 500–2 000 ₴ (+25%), 2 000–10 000 ₴ (+15%), від 10 000 ₴ (+10%)',
                  })}
                  data-testid="apply-default-tiers-btn"
                >
                  <Sparkles className="size-3.5 text-muted-foreground" />
                  {t('suppliers:applyDefaultTiersBtn', {
                    defaultValue: 'Застосувати стандартну сітку (4 пороги)',
                  })}
                </Button>
              </div>
            ) : (
              <Table className="text-xs">
                <TableHeader className="sticky top-0 z-10 bg-card border-b border-border/60">
                  <TableRow className="h-9 hover:bg-transparent">
                    <TableHead className="px-3 py-1.5 w-12 text-xs font-medium text-muted-foreground">
                      {t('suppliers:colRuleStatus', { defaultValue: 'Активність' })}
                    </TableHead>
                    <TableHead className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {t('suppliers:colRuleScope', {
                        defaultValue: 'Умова / Діапазон собівартості',
                      })}
                    </TableHead>
                    <TableHead className="px-3 py-1.5 text-center text-xs font-medium text-muted-foreground">
                      {t('suppliers:colMarkup', { defaultValue: 'Націнка' })}
                    </TableHead>
                    <TableHead className="px-3 py-1.5 text-center text-xs font-medium text-muted-foreground hidden sm:table-cell">
                      {t('suppliers:colRuleExample', {
                        defaultValue: 'Приклад (Вхід ➔ Вихід)',
                      })}
                    </TableHead>
                    <TableHead className="px-3 py-1.5 text-right text-xs font-medium text-muted-foreground">
                      {t('common:actions', { defaultValue: 'Дія' })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((r) => (
                    <SupplierPricingRuleRow
                      key={r.id}
                      rule={r}
                      isMatched={simulation.matchedRuleId === r.id}
                      isEditing={editingRuleId === r.id}
                      onToggleActive={handleToggleRuleActive}
                      onEdit={handleStartEdit}
                      onDelete={handleDeleteRule}
                      onSelectForSimulation={handleSelectRuleForSimulation}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-5 sticky top-2">
          <SupplierPriceSimulator
            simCost={simCost}
            onSimCostChange={setSimCost}
            simCategoryId={simCategoryId}
            onSimCategoryIdChange={setSimCategoryId}
            categories={categories}
            simulation={simulation}
            roundingMode={supplier.priceRounding}
          />
        </div>
      </div>
    </div>
  );
};
