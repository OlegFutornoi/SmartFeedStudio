import { ShieldCheck } from 'lucide-react';
import type { FeatureCategory } from './shared';
import { boolCell } from './shared';

/** Category 4: Enterprise & Advanced Features */
export function buildEnterpriseCategory(isUk: boolean): FeatureCategory {
  return {
    titleUk: '4. B2B & Розширений функціонал (Enterprise & Advanced)',
    titleEn: '4. Enterprise & Advanced Features',
    icon: ShieldCheck,
    rows: [
      {
        labelUk: 'Порівняння версій фіду (Feed Diff)',
        labelEn: 'Feed Version Comparison (Diff)',
        getValue: (p) => boolCell(p.hasFeedDiff, isUk),
      },
      {
        labelUk: 'REST API доступ',
        labelEn: 'REST API Access',
        getValue: (p) => boolCell(p.hasApiAccess, isUk),
      },
      {
        labelUk: 'Webhooks сповіщення',
        labelEn: 'Webhook Notifications',
        getValue: (p) => boolCell(p.hasWebhooks, isUk),
      },
      {
        labelUk: 'Підключення власного S3 (BYOS)',
        labelEn: 'Custom S3 Storage (BYOS)',
        getValue: (p) => boolCell(p.hasCustomS3, isUk),
      },
      {
        labelUk: 'Журнал аудиту дій (Audit Log)',
        labelEn: 'Full Audit Trail Log',
        getValue: (p) => boolCell(p.hasAuditLog, isUk),
      },
      {
        labelUk: 'White-label PDF звіти для клієнтів',
        labelEn: 'White-label PDF Client Reports',
        getValue: (p) => boolCell(p.hasWhiteLabel, isUk),
      },
      {
        labelUk: 'Договір, рахунки та акти для юросіб',
        labelEn: 'Corporate Contracts & Invoices',
        getValue: (p) => boolCell(p.priceMonthly > 0, isUk),
      },
      {
        labelUk: 'Рівень технічної підтримки',
        labelEn: 'Technical Support Level',
        getValue: (p) => (
          <span className="text-xs">
            {p.code === 'STARTER' || p.code === 'FREE'
              ? isUk
                ? 'FAQ / Спільнота'
                : 'FAQ / Community'
              : p.code === 'GROWTH'
                ? isUk
                  ? 'Email (до 48 год)'
                  : 'Email (within 48h)'
                : p.code === 'PRO'
                  ? isUk
                    ? 'Live Chat (до 8 год)'
                    : 'Live Chat (within 8h)'
                  : isUk
                    ? 'Персональний менеджер (до 2 год)'
                    : 'Dedicated Manager (within 2h)'}
          </span>
        ),
      },
      {
        labelUk: 'SLA Uptime гарантія',
        labelEn: 'SLA Uptime Guarantee',
        getValue: (p) =>
          p.slaUptimePercent ? (
            <span className="font-semibold text-foreground">{p.slaUptimePercent}% Uptime</span>
          ) : (
            <span className="text-xs text-muted-foreground">Standard</span>
          ),
      },
    ],
  };
}
