'use client';

import React from 'react';
import { Sparkles, Bot, ArrowLeft, Cpu, ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function AiSettingsPage() {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const aiProviders = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4o / GPT-4o-mini',
      descUk: 'Високоточна генерація та збагачення описів товарів, категорій і атрибутів',
      descEn: 'High-accuracy product descriptions, attribute normalization, and tagging',
      statusUk: 'Скоро',
      statusEn: 'Coming Soon',
      badgeVariant: 'secondary' as const,
      modelDefault: 'gpt-4o',
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude 3.5 Sonnet',
      descUk: 'Глибоке лінгвістичне структурування XML-фідів та складна трансформація даних',
      descEn: 'Deep linguistic structuring of product catalogs and complex schema mapping',
      statusUk: 'Скоро',
      statusEn: 'Coming Soon',
      badgeVariant: 'secondary' as const,
      modelDefault: 'claude-3-5-sonnet',
    },
    {
      id: 'gemini',
      name: 'Google Gemini 1.5 Pro / Flash',
      descUk: 'Швидкісна пакетна обробка великих XML-каталогів з мільйонним контекстним вікном',
      descEn: 'Ultra-fast batch feed processing and multi-modal image/text catalog analysis',
      statusUk: 'В розробці',
      statusEn: 'In Development',
      badgeVariant: 'outline' as const,
      modelDefault: 'gemini-1.5-pro',
    },
  ];

  return (
    <div
      data-testid="ai-settings-page"
      className="flex flex-col gap-8 max-w-5xl animate-in fade-in duration-300"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/settings"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>{isUk ? 'Налаштування' : 'Settings'}</span>
            </Link>
          </div>
          <h1
            data-testid="ai-header-title"
            className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5"
          >
            <Sparkles className="size-6 text-primary" />
            <span>{isUk ? 'Налаштування AI' : 'AI Provider Settings'}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isUk
              ? 'Конфігурація провайдерів штучного інтелекту, лімітів токенів та дефолтних моделей збагачення'
              : 'Configure AI model providers, monthly token quotas, and default enrichment pipelines'}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs">
        <ShieldCheck className="size-5 shrink-0" />
        <div>
          <span className="font-semibold">
            {isUk
              ? 'AI Збагачення інтегровано в тарифи PRO та ENTERPRISE.'
              : 'AI Enrichment is built-in for PRO & ENTERPRISE tiers.'}
          </span>{' '}
          {isUk
            ? 'Налаштування власних ключів API та кастомних промптів для генерації з’явиться у релізі v2.1.'
            : 'Custom API keys bringing and personalized prompt engineering will unlock in v2.1.'}
        </div>
      </div>

      {/* AI Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiProviders.map((provider) => (
          <Card
            key={provider.id}
            className="border-border/80 bg-card/60 backdrop-blur-sm shadow-sm hover:border-border transition-all flex flex-col justify-between"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <Badge
                  variant={provider.badgeVariant}
                  className="text-[10px] uppercase font-semibold"
                >
                  {isUk ? provider.statusUk : provider.statusEn}
                </Badge>
              </div>
              <CardTitle className="text-base mt-3">{provider.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {isUk ? provider.descUk : provider.descEn}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 flex items-center justify-between border-t border-border/50 mt-4">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <Cpu className="size-3 text-primary" />
                <span>{provider.modelDefault}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-7 text-xs gap-1.5 opacity-60"
              >
                <span>{isUk ? 'Ключі' : 'Keys'}</span>
                <ExternalLink className="size-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
