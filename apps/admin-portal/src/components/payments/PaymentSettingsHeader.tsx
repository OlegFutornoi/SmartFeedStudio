'use client';

import React from 'react';
import { WalletCards, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PaymentSettingsHeaderProps {
  isUk: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export const PaymentSettingsHeader: React.FC<PaymentSettingsHeaderProps> = ({
  isUk,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Link
            href="/settings"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>{isUk ? 'Налаштування' : 'Settings'}</span>
          </Link>
        </div>
        <h1
          data-testid="payments-header-title"
          className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5"
        >
          <WalletCards className="size-6 text-primary" />
          <span>{isUk ? 'Платіжні системи' : 'Payment Gateways'}</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {isUk
            ? 'Підключення та конфігурація платіжного шлюзу WayForPay, тестового терміналу Sandbox та ключів мерчанта'
            : 'Configure WayForPay gateway, Sandbox test terminal credentials, and live production keys'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/transactions">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <span>{isUk ? 'Журнал транзакцій' : 'View Transactions'}</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 px-2 text-xs"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};
