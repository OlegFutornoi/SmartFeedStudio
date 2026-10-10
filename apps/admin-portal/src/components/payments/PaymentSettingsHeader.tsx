'use client';

import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href="/settings"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>{isUk ? 'До налаштувань' : 'Back to Settings'}</span>
      </Link>

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
