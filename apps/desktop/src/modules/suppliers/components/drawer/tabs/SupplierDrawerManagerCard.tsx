import React from 'react';
import { UserCheck, Briefcase, Phone, Mail, Send, ExternalLink, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';

interface SupplierDrawerManagerCardProps {
  supplier: SupplierDto;
}

export const SupplierDrawerManagerCard: React.FC<SupplierDrawerManagerCardProps> = ({
  supplier,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const telegramHandle = supplier.managerTelegram?.replace(/^@/, '');

  return (
    <Card className="shadow-xs border-border/80" data-testid="supplier-overview-manager-card">
      <CardHeader className="py-2.5 px-4 border-b border-border/60">
        <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <User className="size-3.5 text-primary" />
          {t('suppliers:managerCard', { defaultValue: 'Відповідальний менеджер' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="size-3 text-muted-foreground shrink-0" />
            {t('suppliers:managerName', { defaultValue: 'ПІБ' })}
          </span>
          <span
            className="font-medium text-foreground"
            data-testid="supplier-overview-manager-name"
          >
            {supplier.managerName || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="size-3 text-muted-foreground shrink-0" />
            {t('suppliers:managerPosition', { defaultValue: 'Посада' })}
          </span>
          <span
            className="font-medium text-foreground"
            data-testid="supplier-overview-manager-position"
          >
            {supplier.managerPosition || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Phone className="size-3 text-muted-foreground shrink-0" />
            {t('common:phone', { defaultValue: 'Телефон' })}
          </span>
          <span
            className="font-medium text-foreground"
            data-testid="supplier-overview-manager-phone"
          >
            {(() => {
              const p = supplier.managerPhone || supplier.contactPhone;
              return p && /\d/.test(p) ? p : '—';
            })()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Mail className="size-3 text-muted-foreground shrink-0" />
            Email
          </span>
          <span
            className="font-medium text-foreground truncate max-w-[170px]"
            data-testid="supplier-overview-manager-email"
          >
            {supplier.managerEmail || supplier.contactEmail || '—'}
          </span>
        </div>
        {telegramHandle && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Send className="size-3 text-primary shrink-0" />
              Telegram
            </span>
            <a
              href={`https://t.me/${telegramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline flex items-center gap-1"
              data-testid="supplier-overview-manager-telegram"
            >
              @{telegramHandle}
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
