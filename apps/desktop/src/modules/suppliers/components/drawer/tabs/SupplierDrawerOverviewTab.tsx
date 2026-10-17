import React from 'react';
import {
  Mail,
  Phone,
  User,
  UserCheck,
  Briefcase,
  Globe,
  Coins,
  Percent,
  Sliders,
  FileText,
  Hash,
  Factory,
  Layers,
  MapPin,
  Navigation,
  Warehouse,
  Building2,
  Send,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';
import { SupplierDrawerKpiMetrics } from '@/modules/suppliers/components/drawer/tabs/SupplierDrawerKpiMetrics';

interface SupplierDrawerOverviewTabProps {
  supplier: SupplierDto;
  onNavigateToTab?: (tab: string) => void;
}

export const SupplierDrawerOverviewTab: React.FC<SupplierDrawerOverviewTabProps> = ({
  supplier,
  onNavigateToTab,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  const telegramHandle = supplier.managerTelegram?.replace(/^@/, '');

  return (
    <div className="space-y-4 p-5" data-testid="supplier-drawer-overview-tab">
      {/* 4 KPI Metrics */}
      <SupplierDrawerKpiMetrics supplier={supplier} onNavigateToTab={onNavigateToTab} />

      {/* 2x2 Grid of CRM Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card 1: Company & Business Details */}
        <Card className="shadow-xs border-border/80" data-testid="supplier-overview-company-card">
          <CardHeader className="py-2.5 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" />
              {t('suppliers:companyCard', { defaultValue: 'Реквізити компанії' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:legalName', { defaultValue: 'Юридична назва' })}
              </span>
              <span
                className="font-medium text-foreground text-right"
                data-testid="supplier-overview-legal-name"
              >
                {supplier.legalName || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Hash className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:taxId', { defaultValue: 'ЄДРПОУ / ІПН' })}
              </span>
              <span
                className="font-mono text-foreground font-medium"
                data-testid="supplier-overview-tax-id"
              >
                {supplier.taxId || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Factory className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:industry', { defaultValue: 'Галузь' })}
              </span>
              <span
                className="font-medium text-foreground"
                data-testid="supplier-overview-industry"
              >
                {supplier.industry || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:segment', { defaultValue: 'Сегмент' })}
              </span>
              <span className="font-medium text-foreground" data-testid="supplier-overview-segment">
                {supplier.segment || '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Manager & Direct Contacts */}
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

        {/* Card 3: Warehouse & Address */}
        <Card className="shadow-xs border-border/80" data-testid="supplier-overview-warehouse-card">
          <CardHeader className="py-2.5 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-primary" />
              {t('suppliers:warehouseCard', { defaultValue: 'Склад та логістика' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Navigation className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:city', { defaultValue: 'Місто / Країна' })}
              </span>
              <span
                className="font-medium text-foreground"
                data-testid="supplier-overview-city-country"
              >
                {[supplier.city, supplier.country].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Warehouse className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:address', { defaultValue: 'Адреса' })}
              </span>
              <span
                className="font-medium text-foreground truncate max-w-[180px]"
                data-testid="supplier-overview-address"
              >
                {supplier.address || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Globe className="size-3 text-muted-foreground shrink-0" />
                {t('common:website', { defaultValue: 'Вебсайт' })}
              </span>
              {supplier.website ? (
                <a
                  href={
                    supplier.website.startsWith('http')
                      ? supplier.website
                      : `https://${supplier.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline flex items-center gap-1 truncate max-w-[170px]"
                  data-testid="supplier-overview-website-link"
                >
                  <span className="truncate">{supplier.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                <span className="font-medium text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Currency & Commercial Markups */}
        <Card
          className="shadow-xs border-border/80"
          data-testid="supplier-overview-commercial-card"
        >
          <CardHeader className="py-2.5 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Coins className="size-3.5 text-primary" />
              {t('suppliers:commercialConditions', { defaultValue: 'Комерційні умови' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Coins className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:baseCurrencyShort', { defaultValue: 'Базова валюта' })}
              </span>
              <span className="font-medium text-foreground">{supplier.baseCurrency || 'UAH'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Percent className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:baseMarkupShort', { defaultValue: 'Базова націнка' })}
              </span>
              <span className="font-medium text-primary">
                +{supplier.defaultMarginPercent || 0}%
                {supplier.defaultFixedMarkup ? ` +${supplier.defaultFixedMarkup} ₴` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sliders className="size-3 text-muted-foreground shrink-0" />
                {t('suppliers:priceRoundingShort', { defaultValue: 'Крок округлення' })}
              </span>
              <span className="font-medium text-foreground">
                {supplier.priceRounding || 'NONE'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description / Notes */}
      {supplier.notes && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="py-2.5 px-4 border-b border-border/60">
            <CardTitle className="text-xs font-semibold text-foreground">
              {t('common:description', { defaultValue: 'Примітки та умови співпраці' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {supplier.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
