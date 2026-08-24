'use client';

import React from 'react';
import { Check, Sparkles, Pencil, Trash2 } from 'lucide-react';
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

  return (
    <Card
      data-testid={`plan-card-${codeKey}`}
      className={`relative flex flex-col justify-between border-border bg-card transition-all ${
        plan.isPopular ? 'border-primary shadow-md' : 'shadow-sm'
      }`}
    >
      {plan.isPopular && (
        <div className="absolute -top-2.5 right-4" data-testid={`plan-popular-badge-${codeKey}`}>
          <Badge className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 flex items-center gap-1 shadow-sm">
            <Sparkles className="size-2.5" />
            <span>{isUk ? 'Популярний' : 'Popular'}</span>
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
            <CardDescription data-testid={`plan-desc-${codeKey}`} className="text-xs">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex items-baseline gap-1">
            <span
              data-testid={`plan-price-monthly-${codeKey}`}
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              ${plan.priceMonthly}
            </span>
            <span className="text-xs text-muted-foreground">{isUk ? '/міс' : '/mo'}</span>
            {plan.priceYearly !== null && plan.priceYearly !== undefined && (
              <span
                data-testid={`plan-price-yearly-${codeKey}`}
                className="text-[11px] text-muted-foreground ml-auto"
              >
                ${plan.priceYearly} {isUk ? '/рік' : '/yr'}
              </span>
            )}
          </div>

          <div className="h-[1px] w-full bg-border/60" />

          {/* Quota Highlights */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div
              data-testid={`plan-xml-limit-${codeKey}`}
              className="p-2 rounded-md bg-secondary/40 border border-border/50"
            >
              <span className="block text-[10px] uppercase tracking-wider font-semibold">
                {isUk ? 'XML Ліміт' : 'XML Limit'}
              </span>
              <span className="font-semibold text-foreground">
                {plan.maxXmlLimit.toLocaleString()}
              </span>
            </div>
            <div
              data-testid={`plan-ai-credits-${codeKey}`}
              className="p-2 rounded-md bg-secondary/40 border border-border/50"
            >
              <span className="block text-[10px] uppercase tracking-wider font-semibold">
                {isUk ? 'AI Кредити' : 'AI Credits'}
              </span>
              <span className="font-semibold text-foreground">
                {plan.aiCredits.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Feature List */}
          {features && features.length > 0 && (
            <div
              data-testid={`plan-features-list-${codeKey}`}
              className="flex flex-col gap-1.5 pt-1"
            >
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="size-3 text-muted-foreground shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
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
