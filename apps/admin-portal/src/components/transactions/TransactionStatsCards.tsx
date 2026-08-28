'use client';

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { PaymentStatsDto } from '@smartfeed/shared';
import { TrendingUp, CheckCircle2, Receipt, Percent } from 'lucide-react';

interface TransactionStatsCardsProps {
  stats: PaymentStatsDto | null;
  isUk: boolean;
}

export function TransactionStatsCards({ stats, isUk }: TransactionStatsCardsProps) {
  const cards = [
    {
      title: isUk ? 'Загальний дохід' : 'Total Revenue',
      value: `${(stats?.totalRevenueUah || 0).toLocaleString()} грн`,
      subtitle: isUk ? 'Успішні транзакції' : 'Successful charges',
      icon: TrendingUp,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: isUk ? 'Успішні оплати' : 'Successful Payments',
      value: (stats?.successfulCount || 0).toLocaleString(),
      subtitle: isUk
        ? `${stats?.pendingCount || 0} в очікуванні`
        : `${stats?.pendingCount || 0} pending`,
      icon: CheckCircle2,
      color: 'text-primary bg-primary/10',
    },
    {
      title: isUk ? 'Середній чек' : 'Average Check',
      value: `${(stats?.averageCheckUah || 0).toLocaleString()} грн`,
      subtitle: isUk ? 'На одну транзакцію' : 'Per transaction',
      icon: Receipt,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: isUk ? 'Конверсія оплат' : 'Success Rate',
      value: `${stats?.successRatePercent ?? 100}%`,
      subtitle: isUk ? 'Співвідношення успіху' : 'Approval ratio',
      icon: Percent,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div data-testid="transaction-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card key={i} className="border-border/70 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{c.title}</p>
                <h3 className="text-xl font-bold text-foreground mt-0.5 tracking-tight">
                  {c.value}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.subtitle}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.color}`}>
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
