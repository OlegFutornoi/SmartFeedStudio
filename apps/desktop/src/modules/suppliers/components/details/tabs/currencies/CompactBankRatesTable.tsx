import React, { useState, useEffect } from 'react';
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
}

const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  CurrencyCode.USD,
  CurrencyCode.EUR,
  CurrencyCode.PLN,
  CurrencyCode.GBP,
];

export const CompactBankRatesTable: React.FC<CompactBankRatesTableProps> = ({
  selectedCurrency,
  onCurrencyChange,
  selectedBankId,
  onSelectBankRate,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const [bankRates, setBankRates] = useState<BankExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadRates = async (currency: CurrencyCode, force = false) => {
    setIsLoading(true);
    try {
      const rates = await fetchBankExchangeRates(currency, force);
      setBankRates(rates);
      if (rates.length > 0) {
        setLastUpdated(rates[0].updatedAt);
      }
    } catch (err) {
      console.warn('[CompactBankRatesTable:loadRates] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates(selectedCurrency);
  }, [selectedCurrency]);

  return (
    <div
      className="p-3.5 rounded-xl border border-border/70 bg-card flex flex-col justify-between space-y-3"
      data-testid="compact-bank-rates-table"
    >
      {/* Header with Currency Pills and Sync Button */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground">
            {t('suppliers:bankRatesTitle', { defaultValue: 'Курси банків' })}
          </span>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
              ({lastUpdated})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-0.5">
            {SUPPORTED_CURRENCIES.map((curr) => (
              <Button
                key={curr}
                variant="ghost"
                size="sm"
                onClick={() => onCurrencyChange(curr)}
                className={cn(
                  'h-6 px-2 py-0.5 rounded text-2xs font-semibold transition-all',
                  selectedCurrency === curr
                    ? 'bg-background text-foreground shadow-xs font-bold'
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
            onClick={() => loadRates(selectedCurrency, true)}
            disabled={isLoading}
            className="size-6 p-0 text-muted-foreground hover:text-foreground"
            title={t('suppliers:refreshRatesTooltip', { defaultValue: 'Оновити котирування' })}
          >
            <RefreshCw className={cn('size-3', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Financial Table Matrix */}
      <div className="overflow-hidden rounded-lg border border-border/50 bg-background/50">
        <Table className="w-full text-left border-collapse table-fixed">
          <TableHeader>
            <TableRow className="border-b border-border/40 bg-muted/20 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider h-7">
              <TableHead className="w-[38%] py-1 px-2.5 font-medium">
                {t('suppliers:colBank', { defaultValue: 'Банк' })}
              </TableHead>
              <TableHead className="w-[22%] py-1 px-1.5 text-right font-medium">
                {t('suppliers:colBuy', { defaultValue: 'Купівля' })}
              </TableHead>
              <TableHead className="w-[24%] py-1 px-1.5 text-right font-medium">
                {t('suppliers:colSell', { defaultValue: 'Продаж' })}
              </TableHead>
              <TableHead className="w-[16%] py-1 px-2 text-right font-medium">
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
                    'group cursor-pointer transition-colors select-none h-8',
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted/40 text-foreground',
                  )}
                  data-testid={`bank-row-${rate.bankId}`}
                >
                  {/* Bank Column: Logo + Name */}
                  <TableCell className="py-1 px-2.5 align-middle">
                    <div className="flex items-center gap-2 min-w-0">
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
                        className={rate.deltaNbu > 0 ? 'text-primary/90' : 'text-muted-foreground'}
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

      {/* Footer hint without redundant counter */}
      <div className="text-[11px] text-muted-foreground pt-0.5">
        <span>
          {t('suppliers:bankRatesHint', {
            defaultValue: 'Клікніть на банк для застосування курсу продажу',
          })}
        </span>
      </div>
    </div>
  );
};
