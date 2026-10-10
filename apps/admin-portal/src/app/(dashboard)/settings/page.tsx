'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sliders,
  CreditCard,
  Bot,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { ThemeCustomizer } from '@/components/theme/theme-customizer';

export default function SettingsPage() {
  const { t, locale } = useLanguage();
  const isUk = locale === 'uk';

  return (
    <div
      data-testid="settings-page"
      className="space-y-6 w-full animate-in fade-in duration-300 max-w-5xl"
    >
      <span data-testid="settings-header-subtitle" className="sr-only">
        {t('settings', 'subtitle')}
      </span>

      {/* Top Header Section */}
      <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Sliders className="size-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {isUk ? 'Налаштування платформи' : 'Platform Settings'}
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          {isUk
            ? 'Керування оформленням інтерфейсу, платіжними шлюзами, AI та юридичними документами'
            : 'Configure interface appearance, payment gateways, AI, and legal documentation'}
        </p>
      </div>

      {/* 1. Theme & Appearance Section */}
      <div className="w-full">
        <ThemeCustomizer />
      </div>

      {/* 2. Platform Modules: Payments, AI & Legal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {/* Payment Gateways Card */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  {isUk ? 'Платіжні системи' : 'Payment Gateways'}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                <ShieldCheck className="size-2.5 text-emerald-500" />
                <span>WayForPay</span>
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {isUk
                ? 'Налаштування онлайн-оплат, мерчантів, валюти та Webhook-сповіщень'
                : 'Configure merchant keys, payment webhooks, and billing providers'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/settings/payments">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 justify-between"
              >
                <span>{isUk ? 'Керувати платежами' : 'Manage Payments'}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Providers Card */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  {isUk ? 'AI Інтеграції & Моделі' : 'AI Integrations & Models'}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                <Sparkles className="size-2.5 text-amber-500" />
                <span>3 {isUk ? 'провайдери' : 'providers'}</span>
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {isUk
                ? 'Провайдери OpenAI GPT-4o, Anthropic Claude та Google Gemini'
                : 'Configure OpenAI, Anthropic Claude, and Google Gemini API keys'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/settings/ai">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 justify-between"
              >
                <span>{isUk ? 'Налаштувати AI' : 'Configure AI'}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Legal Documents Card */}
        <Card className="border-border/80 bg-card/60 backdrop-blur-xs shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  {isUk ? 'Юридичні документи' : 'Legal Documents'}
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1 font-mono">
                <FileCheck className="size-2.5 text-blue-500" />
                <span>{isUk ? 'Публічні угоди' : 'Public Policies'}</span>
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {isUk
                ? 'Керування Умовами використання, Політикою конфіденційності та офертою'
                : 'Manage Terms of Service, Privacy Policy, and platform agreements'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/settings/legal">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 justify-between"
              >
                <span>{isUk ? 'Редагувати документи' : 'Manage Legal'}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
