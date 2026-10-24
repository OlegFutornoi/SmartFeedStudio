import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { CurrencyCode } from '@smartfeed/shared';
import { fetchBankExchangeRates, BankExchangeRate } from '@/lib/api/currencies';
import { BankLogo } from '@/modules/suppliers/components/details/tabs/currencies/BankLogo';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

interface CompactBankRatesTableProps {
  selectedCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  selectedBankId?: string;
  onSelectBankRate: (bankRate: BankExchangeRate) => void;
  onRatesLoaded?: (currency: CurrencyCode, rates: BankExchangeRate[]) => void;
}

const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  CurrencyCode.USD,
  CurrencyCode.EUR,
  CurrencyCode.PLN,
  CurrencyCode.GBP,
  CurrencyCode.CNY,
];

export const CompactBankRatesTable: React.FC<CompactBankRatesTableProps> = ({
  selectedCurrency,
  onCurrencyChange,
  selectedBankId,
  onSelectBankRate,
  onRatesLoaded,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [bankRates, setBankRates] = useState<BankExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const isFetchingRef = useRef(false);
  const onRatesLoadedRef = useRef(onRatesLoaded);
  onRatesLoadedRef.current = onRatesLoaded;

  const loadRates = useCallback(async (currency: CurrencyCode, force = false) => {
    if (isFetchingRef.current && !force) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const rates = await fetchBankExchangeRates(currency, force);
      setBankRates(rates);
      if (rates.length > 0) {
        setLastUpdated(rates[0].updatedAt);
      }
      onRatesLoadedRef.current?.(currency, rates);
    } catch (err) {
      console.warn('[CompactBankRatesTable:loadRates] Error:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRates(selectedCurrency, false);
  }, [selectedCurrency, loadRates]);

  return (
    <div
      className="p-2.5 rounded-lg border border-border/70 bg-card shadow-xs flex flex-col justify-between space-y-1.5"
      data-testid="compact-bank-rates-table"
    >
      {/* Header with Currency Pills and Sync Button */}
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">
            {t('suppliers:bankRatesTitle', { defaultValue: 'Курси банків' })}
          </span>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0">
              ({lastUpdated})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center rounded-md border border-border/60 bg-muted/30 p-0.5">
            {SUPPORTED_CURRENCIES.map((curr) => (
              <Button
                key={curr}
                variant="ghost"
                size="sm"
                onClick={() => onCurrencyChange(curr)}
                data-testid={`bank-currency-pill-${curr}`}
                className={cn(
                  'h-5 px-1.5 py-0 rounded-sm text-[10px] font-mono font-semibold transition-colors',
                  selectedCurrency === curr
                    ? 'bg-background text-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {curr}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadRates(selectedCurrency, true)}
            disabled={isLoading}
            className="size-6 p-0 text-muted-foreground hover:text-foreground"
            title={t('suppliers:refreshRatesTooltip', { defaultValue: 'Оновити котирування' })}
          >
            <RefreshCw className={cn('size-3', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Financial Table Matrix (UI-11 flat hairline divider, zero nested box) */}
      <div className="overflow-hidden border-y border-border/40">
        <Table className="w-full text-left border-collapse table-fixed">
          <TableHeader>
            <TableRow className="border-b border-border/40 bg-muted/20 text-[11px] font-medium text-muted-foreground h-6">
              <TableHead className="w-[38%] py-0.5 px-2 font-medium">
                {t('suppliers:colBank', { defaultValue: 'Банк' })}
              </TableHead>
              <TableHead className="w-[22%] py-0.5 px-1.5 text-right font-medium">
                {t('suppliers:colBuy', { defaultValue: 'Купівля' })}
              </TableHead>
              <TableHead className="w-[24%] py-0.5 px-1.5 text-right font-medium">
                {t('suppliers:colSell', { defaultValue: 'Продаж' })}
              </TableHead>
              <TableHead className="w-[16%] py-0.5 px-2 text-right font-medium">
                ± {t('suppliers:colNbu', { defaultValue: 'НБУ' })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/30 text-xs">
            {bankRates.map((rate) => {
              const isSelected = selectedBankId === rate.bankId;
              const deltaSign =
                rate.deltaNbu > 0 ? `+${rate.deltaNbu.toFixed(2)}` : rate.deltaNbu.toFixed(2);

              return (
                <TableRow
                  key={rate.bankId}
                  onClick={() => onSelectBankRate(rate)}
                  className={cn(
                    'group cursor-pointer transition-colors select-none h-6.5',
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/40 text-foreground',
                  )}
                  data-testid={`bank-row-${rate.bankId}`}
                >
                  {/* Bank Column: Logo + Name */}
                  <TableCell className="py-0.5 px-2 align-middle">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BankLogo
                        bankId={rate.bankId}
                        bankName={rate.bankName}
                        logoUrl={rate.logoUrl}
                        updatedAt={rate.updatedAt}
                      />
                      <span className="text-xs truncate font-medium">{rate.bankName}</span>
                      {isSelected && <Check className="size-3 text-primary shrink-0 ml-0.5" />}
                    </div>
                  </TableCell>

                  {/* Buy Column */}
                  <TableCell className="py-1 px-1.5 text-right font-mono tabular-nums text-2xs text-muted-foreground align-middle">
                    {rate.buyRate.toFixed(2)} ₴
                  </TableCell>

                  {/* Sell Column (Primary) */}
                  <TableCell className="py-1 px-1.5 text-right font-mono tabular-nums text-xs font-semibold text-foreground align-middle">
                    {rate.sellRate.toFixed(2)} ₴
                  </TableCell>

                  {/* Delta NBU Column */}
                  <TableCell className="py-1 px-2 text-right font-mono tabular-nums text-2xs text-muted-foreground align-middle">
                    {rate.bankId === 'nbu' ? (
                      <span className="text-muted-foreground/60">—</span>
                    ) : (
                      <span
                        className={
                          rate.deltaNbu > 0 ? 'text-foreground/80' : 'text-muted-foreground'
                        }
                      >
                        {deltaSign}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Footer hint */}
      <div className="text-[11px] text-muted-foreground leading-tight">
        <span>
          {t('suppliers:bankRatesHint', {
            defaultValue: 'Клікніть на банк для застосування курсу продажу',
          })}
        </span>
      </div>
    </div>
  );
};
