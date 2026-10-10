import { useState, useEffect } from 'react';
import type { LiveOrderItem } from '@/modules/growth-showcase/types';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LiveSalesTickerProps {
  orders: LiveOrderItem[];
  isUk: boolean;
}

export function LiveSalesTicker({ orders, isUk }: LiveSalesTickerProps) {
  const [activeOrderIdx, setActiveOrderIdx] = useState(0);

  useEffect(() => {
    if (!orders.length) return;
    const interval = setInterval(() => {
      setActiveOrderIdx((prev) => (prev + 1) % orders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [orders.length]);

  const order = orders[activeOrderIdx] || orders[0];

  const formatAmount = (val: number) => {
    return isUk
      ? `+₴${val.toLocaleString('uk-UA')}`
      : `+$${Math.round(val / 37).toLocaleString('en-US')}`;
  };

  return (
    <div
      data-testid="live-sales-ticker"
      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 shadow-xs backdrop-blur-xs text-[11px]"
    >
      {/* Left Marketplace & Pulse */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>

        <Badge
          variant="outline"
          className="h-4 border-border/80 px-1.5 text-[9px] font-semibold text-foreground uppercase tracking-wider"
        >
          {order.marketplace}
        </Badge>

        <span className="truncate text-muted-foreground font-medium">
          {isUk ? order.productTitleUk : order.productTitleEn}
        </span>
      </div>

      {/* Right Order Amount & Timestamp */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
          <ArrowUpRight className="h-3 w-3" />
          <span>{formatAmount(order.amount)}</span>
        </span>
        <span className="text-[10px] text-muted-foreground">
          {isUk ? order.timeAgoUk : order.timeAgoEn}
        </span>
      </div>
    </div>
  );
}
