import React from 'react';
import { History, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@/i18n';
import type { SupplierSyncLogDto } from '@smartfeed/shared';

interface SupplierSyncHistoryTableProps {
  logs: SupplierSyncLogDto[];
}

export const SupplierSyncHistoryTable: React.FC<SupplierSyncHistoryTableProps> = ({ logs }) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <Card className="border-border/80 shadow-xs" data-testid="supplier-sync-history-table">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="size-4 text-primary" />
          {t('suppliers:historyCardTitle', { defaultValue: 'Журнал та історія синхронізацій' })}
        </CardTitle>
        <CardDescription className="text-xs">
          {t('suppliers:historyCardDesc', {
            defaultValue:
              'Аудит-лог усіх сеансів оновлення товарів постачальника із детальними підсумками',
          })}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3 p-0">
        {safeLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
            <Clock className="size-6 text-muted-foreground/50 mx-auto mb-2" />
            <p className="font-medium text-foreground">
              {t('suppliers:noLogsYet', { defaultValue: 'Історія синхронізацій порожня' })}
            </p>
            <p>
              {t('suppliers:noLogsDesc', {
                defaultValue:
                  'Натисніть кнопку «Синхронізувати зараз», щоб запустити перший сеанс оновлення',
              })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-2xs font-semibold h-8">
                    {t('suppliers:colLogDate', { defaultValue: 'Дата та час' })}
                  </TableHead>
                  <TableHead className="text-2xs font-semibold h-8">
                    {t('suppliers:colLogTrigger', { defaultValue: 'Тип' })}
                  </TableHead>
                  <TableHead className="text-2xs font-semibold h-8">
                    {t('suppliers:colLogStatus', { defaultValue: 'Статус' })}
                  </TableHead>
                  <TableHead className="text-2xs font-semibold h-8">
                    {t('suppliers:colLogDuration', { defaultValue: 'Тривалість' })}
                  </TableHead>
                  <TableHead className="text-2xs font-semibold h-8 text-right">
                    {t('suppliers:colLogProducts', { defaultValue: 'Оновлено / Всього' })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeLogs.map((log) => {
                  const dateStr = new Date(log.startedAt).toLocaleString('uk-UA', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <TableRow key={log.id} className="text-xs">
                      <TableCell className="py-2.5 font-medium whitespace-nowrap">
                        {dateStr}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-3xs py-0">
                          {log.trigger === 'MANUAL'
                            ? t('suppliers:triggerManual', { defaultValue: 'Вручну' })
                            : log.trigger === 'SCHEDULED'
                              ? t('suppliers:triggerScheduled', { defaultValue: 'Розклад' })
                              : t('suppliers:triggerFeed', { defaultValue: 'Фід' })}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        {log.status === 'SUCCESS' ? (
                          <Badge
                            variant="outline"
                            className="bg-success/15 text-success border-success/30 text-3xs gap-1 py-0"
                          >
                            <CheckCircle2 className="size-2.5" />
                            {t('suppliers:statusSuccess', { defaultValue: 'Успішно' })}
                          </Badge>
                        ) : log.status === 'RUNNING' ? (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary text-3xs py-0"
                          >
                            {t('suppliers:statusRunning', { defaultValue: 'Триває' })}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/30 text-3xs gap-1 py-0"
                          >
                            <AlertCircle className="size-2.5" />
                            {t('suppliers:statusFailed', { defaultValue: 'Збій' })}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                        {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)} с` : '—'}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono tabular-nums">
                        <span className="text-foreground font-semibold">{log.updatedCount}</span>
                        <span className="text-muted-foreground"> / {log.totalProducts}</span>
                        {log.outOfStockCount > 0 && (
                          <span className="text-muted-foreground text-2xs ml-1">
                            ({log.outOfStockCount} обнулено)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
