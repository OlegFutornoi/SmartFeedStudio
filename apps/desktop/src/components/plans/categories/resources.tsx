import { Cpu } from 'lucide-react';
import type { FeatureCategory } from '@/components/plans/categories/shared';
import { boolCell } from '@/components/plans/categories/shared';

/** Category 3: Resources & Automation */
export function buildResourcesCategory(isUk: boolean): FeatureCategory {
  return {
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
  };
}
