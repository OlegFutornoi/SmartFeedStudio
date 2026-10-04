import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';
import { FeatureCategory, boolCell } from '@/components/plans/comparisonCellRenderers';

export function getAdvancedCategories(isUk: boolean): FeatureCategory[] {
  return [
    // 3. Ресурси та команда (Resources)
    {
      titleUk: '3. Ресурси та автоматизація (Resources & Automation)',
      titleEn: '3. Resources & Automation',
      icon: Cpu,
      rows: [
        {
          labelUk: 'Місць у команді',
          labelEn: 'Team Seats',
          getValue: (p) => (
            <span className="font-semibold">
              {p.maxTeamSeats >= 10
                ? isUk
                  ? '10+ місць'
                  : '10+ seats'
                : isUk
                  ? `${p.maxTeamSeats} користувач`
                  : `${p.maxTeamSeats} user`}
            </span>
          ),
        },
        {
          labelUk: 'Хмарне сховище S3 / Cloudflare R2',
          labelEn: 'S3 Cloud Storage / Cloudflare R2',
          getValue: (p) => (
            <span className="font-medium">
              {p.maxStorageGb === 0
                ? isUk
                  ? '0 GB (Офлайн)'
                  : '0 GB (Offline)'
                : `${p.maxStorageGb} GB`}
            </span>
          ),
        },
        {
          labelUk: 'Спільна синхронізація команди (Hub & Spoke)',
          labelEn: 'Team Collaboration (Hub & Spoke S3 Sync)',
          getValue: (p) => boolCell(p.maxTeamSeats > 1 || p.maxStorageGb >= 10, isUk),
        },
        {
          labelUk: 'AI Кредити на місяць',
          labelEn: 'AI Credits per month',
          getValue: (p) => (
            <span className="font-semibold text-foreground">
              {p.aiCredits.toLocaleString()} {isUk ? 'кредитів' : 'credits'}
            </span>
          ),
        },
        {
          labelUk: 'Частота авто-оновлення фідів',
          labelEn: 'Feed Auto-Sync Frequency',
          getValue: (p) => (
            <span className="font-medium">
              {p.syncFrequencyHours === 0
                ? isUk
                  ? 'Тільки вручну'
                  : 'Manual only'
                : p.syncFrequencyHours === 24
                  ? isUk
                    ? '1 раз на добу (24 год)'
                    : 'Once per day (24h)'
                  : p.syncFrequencyHours === 4
                    ? isUk
                      ? 'Кожні 4 години'
                      : 'Every 4 hours'
                    : isUk
                      ? 'Щогодини (1 год)'
                      : 'Hourly (1h)'}
            </span>
          ),
        },
      ],
    },

    // 4. B2B & Розширений функціонал (Advanced)
    {
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
              <span className="font-semibold text-primary">{p.slaUptimePercent}% Uptime</span>
            ) : (
              <span className="text-xs text-muted-foreground">Standard</span>
            ),
        },
      ],
    },
  ];
}
