import React from 'react';
import { Check, X, Box, Users, Share2, Bot } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { TariffPlanDto } from '@smartfeed/shared';

interface PlanFeatureBulletListProps {
  plan: TariffPlanDto;
  isUk: boolean;
}

export const PlanFeatureBulletList: React.FC<PlanFeatureBulletListProps> = ({ plan, isUk }) => {
  const { t } = useTranslation(['plans', 'common']);
  const features = isUk ? plan.featuresUk : plan.featuresEn;
  const codeKey = plan.code.toLowerCase();

  const unavailableFeatures: string[] = [];
  if (!plan.canCloudBackup && plan.maxStorageGb === 0) {
    unavailableFeatures.push(
      isUk ? 'Хмарний бекап S3 / Cloudflare R2' : 'S3 / Cloudflare Cloud Backup',
    );
  }
  if (plan.maxTeamSeats <= 1) {
    unavailableFeatures.push(
      isUk ? 'Спільна робота команди (Hub & Spoke)' : 'Team Collaboration (Hub & Spoke)',
    );
  }
  if (!plan.hasFeedDiff) {
    unavailableFeatures.push(
      isUk ? 'Порівняння версій фіду (Feed Diff)' : 'Feed Version Diff Comparison',
    );
  }
  if (!plan.hasApiAccess) {
    unavailableFeatures.push(isUk ? 'Прямий REST API доступ' : 'Direct REST API Access');
  }
  if (!plan.hasWebhooks) {
    unavailableFeatures.push(isUk ? 'Webhooks сповіщення' : 'Webhook Notifications');
  }
  if (!plan.hasCustomS3) {
    unavailableFeatures.push(isUk ? 'Підключення власного S3 (BYOS)' : 'Custom S3 Storage (BYOS)');
  }
  if (!plan.hasAuditLog) {
    unavailableFeatures.push(isUk ? 'Журнал аудиту дій команди' : 'Team Audit Trail Log');
  }

  const channelsLabel =
    plan.maxChannelsLimit >= 1000
      ? isUk
        ? 'Безліміт'
        : 'Unlimited'
      : `${plan.maxChannelsLimit} ${
          isUk
            ? plan.maxChannelsLimit === 1
              ? 'канал'
              : plan.maxChannelsLimit < 5
                ? 'канали'
                : 'каналів'
            : 'channels'
        }`;

  const teamSeatsLabel =
    plan.maxTeamSeats === 1
      ? isUk
        ? 'Соло (1)'
        : 'Solo (1)'
      : `${plan.maxTeamSeats} ${isUk ? (plan.maxTeamSeats < 5 ? 'місця' : 'місць') : 'seats'}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Key Quotas Grid */}
      <div
        data-testid={`plan-quotas-${codeKey}`}
        className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] leading-snug text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40"
      >
        <div
          className="flex items-center gap-1.5 min-w-0"
          title={`${plan.maxXmlLimit.toLocaleString()} SKU`}
        >
          <Box className="size-3 text-primary shrink-0" />
          <span className="font-medium text-foreground whitespace-nowrap">
            <strong className="font-semibold">{plan.maxXmlLimit.toLocaleString()}</strong>{' '}
            <span className="text-[10px] text-muted-foreground">SKU</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0" title={teamSeatsLabel}>
          <Users className="size-3 text-primary shrink-0" />
          <span className="font-medium text-foreground whitespace-nowrap">
            <strong className="font-semibold">{teamSeatsLabel}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0" title={channelsLabel}>
          <Share2 className="size-3 text-primary shrink-0" />
          <span className="font-medium text-foreground whitespace-nowrap">
            <strong className="font-semibold">{channelsLabel}</strong>
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 min-w-0"
          title={`${plan.aiCredits.toLocaleString()} AI`}
        >
          <Bot className="size-3 text-primary shrink-0" />
          <span className="font-medium text-foreground whitespace-nowrap">
            <strong className="font-semibold">{plan.aiCredits.toLocaleString()}</strong>{' '}
            <span className="text-[10px] text-muted-foreground">AI</span>
          </span>
        </div>
      </div>

      {/* Section 1: Included Features (✅) */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {t('plans.featuresTitle')}
        </span>
        <ul
          data-testid={`plan-features-${codeKey}`}
          className="flex flex-col gap-2 text-xs text-foreground/90"
        >
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="size-3.5 text-foreground shrink-0 mt-0.5" />
              <span className="leading-tight">{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 2: Unavailable / Locked Features (❌) */}
      {unavailableFeatures.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            {t('plans.unavailableFeatures')}
          </span>
          <ul className="flex flex-col gap-2 text-xs text-muted-foreground/60">
            {unavailableFeatures.map((unfeat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <X className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                <span className="line-through decoration-muted-foreground/40 leading-tight">
                  {unfeat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
