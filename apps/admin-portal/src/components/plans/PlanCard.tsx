'use client';

import React from 'react';
import { Check, X, Sparkles, Pencil, Trash2, Box, Users, Share2, Bot } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TariffPlanDto } from '@smartfeed/shared';

interface PlanCardProps {
  plan: TariffPlanDto;
  isUk: boolean;
  onEdit: (plan: TariffPlanDto) => void;
  onDelete: (id: string, code: string) => void;
}

export function PlanCard({ plan, isUk, onEdit, onDelete }: PlanCardProps) {
  const name = isUk ? plan.nameUk : plan.nameEn;
  const description = isUk ? plan.descriptionUk : plan.descriptionEn;
  const features = isUk ? plan.featuresUk : plan.featuresEn;
  const codeKey = plan.code.toLowerCase();
  const currencySymbol = plan.currency === 'UAH' ? 'грн' : '$';

  // Compute locked/unavailable features for visual comparison
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

  return (
    <Card
      data-testid={`plan-card-${codeKey}`}
      className={`relative flex flex-col justify-between border-border bg-card transition-all ${
        plan.isPopular ? 'border-primary ring-1 ring-primary/40 shadow-md' : 'shadow-sm'
      }`}
    >
      {plan.isPopular && (
        <div className="absolute -top-2.5 right-4" data-testid={`plan-popular-badge-${codeKey}`}>
          <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-0.5 flex items-center gap-1 shadow-sm">
            <Sparkles className="size-2.5" />
            <span>{isUk ? 'Хіт продажу' : 'Most Popular'}</span>
          </Badge>
        </div>
      )}

      <div>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle data-testid={`plan-title-${codeKey}`} className="text-base font-semibold">
              {name}
            </CardTitle>
            <Badge
              variant="outline"
              data-testid={`plan-code-badge-${codeKey}`}
              className="text-[10px] font-mono"
            >
              {plan.code}
            </Badge>
          </div>
          {description && (
            <CardDescription data-testid={`plan-desc-${codeKey}`} className="text-xs mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Price Header */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span
                data-testid={`plan-price-monthly-${codeKey}`}
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                {plan.priceMonthly === 0
                  ? isUk
                    ? '0 грн'
                    : 'Free'
                  : `${plan.priceMonthly} ${currencySymbol}`}
              </span>
              <span className="text-xs text-muted-foreground">{isUk ? '/міс' : '/mo'}</span>
            </div>

            {plan.priceYearly && plan.priceYearly > 0 ? (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                <span data-testid={`plan-price-yearly-${codeKey}`}>
                  {plan.priceYearly} {currencySymbol} {isUk ? '/рік' : '/yr'}
                </span>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {isUk ? '-20% знижка' : '-20% discount'}
                </span>
              </div>
            ) : null}
          </div>

          <div className="h-[1px] w-full bg-border/60" />

          {/* 4 Essential Quotas in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* SKU Limit */}
            <div
              data-testid={`plan-xml-limit-${codeKey}`}
              className="p-2 rounded-md bg-secondary/40 border border-border/50 flex flex-col gap-0.5"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                <Box className="size-3 text-primary shrink-0" />
                <span>{isUk ? 'Товари' : 'SKU Limit'}</span>
              </span>
              <span className="font-semibold text-foreground">
                {plan.maxXmlLimit >= 500000
                  ? isUk
                    ? '500k+ (Безліміт)'
                    : '500k+ (Unlimited)'
                  : `${plan.maxXmlLimit.toLocaleString()} SKU`}
              </span>
            </div>

            {/* Suppliers Limit */}
            <div
              data-testid={`plan-suppliers-limit-${codeKey}`}
              className="p-2 rounded-md bg-secondary/40 border border-border/50 flex flex-col gap-0.5"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                <Users className="size-3 text-primary shrink-0" />
                <span>{isUk ? 'Постачальники' : 'Suppliers'}</span>
              </span>
              <span className="font-semibold text-foreground">
                {plan.maxSuppliersLimit >= 999999
                  ? isUk
                    ? 'Безліміт'
                    : 'Unlimited'
                  : isUk
                    ? `До ${plan.maxSuppliersLimit}`
                    : `Up to ${plan.maxSuppliersLimit}`}
              </span>
            </div>

            {/* Channels Limit */}
            <div
              data-testid={`plan-channels-limit-${codeKey}`}
              className="p-2 rounded-md bg-secondary/40 border border-border/50 flex flex-col gap-0.5"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                <Share2 className="size-3 text-primary shrink-0" />
                <span>{isUk ? 'Канали' : 'Channels'}</span>
              </span>
              <span className="font-semibold text-foreground">
                {plan.maxChannelsLimit >= 999999
                  ? isUk
                    ? 'Безліміт'
                    : 'Unlimited'
                  : isUk
                    ? `${plan.maxChannelsLimit} на вибір`
                    : `${plan.maxChannelsLimit} channels`}
              </span>
            </div>

            {/* AI Credits */}
            <div
              data-testid={`plan-ai-credits-${codeKey}`}
              className="p-2 rounded-md bg-secondary/40 border border-border/50 flex flex-col gap-0.5"
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
                <Bot className="size-3 text-primary shrink-0" />
                <span>{isUk ? 'AI Кредити' : 'AI Credits'}</span>
              </span>
              <span className="font-semibold text-foreground">
                {plan.aiCredits.toLocaleString()} {isUk ? '/міс' : '/mo'}
              </span>
            </div>
          </div>

          {/* Section 1: Available Features (✅) */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">
              {isUk ? 'Включено у тариф:' : 'Included in plan:'}
            </span>
            {features && features.length > 0 && (
              <div data-testid={`plan-features-list-${codeKey}`} className="flex flex-col gap-1.5">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Unavailable / Locked Features (❌) */}
          {unavailableFeatures.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isUk ? 'Недоступно в цьому тарифі:' : 'Not included in this tier:'}
              </span>
              <div
                data-testid={`plan-unavailable-list-${codeKey}`}
                className="flex flex-col gap-1.5"
              >
                {unavailableFeatures.slice(0, 4).map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-muted-foreground line-through opacity-60"
                  >
                    <X className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid={`plan-edit-btn-${codeKey}`}
          onClick={() => onEdit(plan)}
          className="flex-1 h-8 text-xs gap-1.5"
        >
          <Pencil className="size-3 text-muted-foreground" />
          <span>{isUk ? 'Редагувати' : 'Edit'}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-testid={`plan-delete-btn-${codeKey}`}
          onClick={() => onDelete(plan.id, plan.code)}
          className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
