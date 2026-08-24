'use client';

import React from 'react';
import { KeyRound, CheckCircle2, Zap, Shield, Sparkles } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

export default function LicensesPage() {
  const plans = [
    {
      name: 'FREE',
      price: '$0',
      description: 'Базовий план, що автоматично створюється при реєстрації через EventBus.',
      features: [
        'До 1,000 позицій XML каталогу',
        '50 AI Кредитів на місяць',
        'Локальне SQLite кешування',
        'Ручний експорт файлів',
      ],
      badgeVariant: 'secondary' as const,
      popular: false,
    },
    {
      name: 'PRO',
      price: '$49',
      period: '/міс',
      description: 'Для інтернет-магазинів із розширеним каталогом та AI оптимізацією.',
      features: [
        'До 50,000 позицій XML каталогу',
        '500 AI Кредитів на місяць',
        'Прямий S3 / MinIO Cloud Backup',
        'Фонові черги BullMQ (Redis 7)',
        'Безпечне збереження в OS Keychain',
      ],
      badgeVariant: 'default' as const,
      popular: true,
    },
    {
      name: 'ENTERPRISE',
      price: '$199',
      period: '/міс',
      description: 'Корпоративна інфраструктура з високою пропускною здатністю.',
      features: [
        'До 1,000,000 позицій XML каталогу',
        '5,000 AI Кредитів на місяць',
        'Необмежені хмарні S3 Snapshots',
        'Власний MinIO / Cloudflare R2 ендпоінт',
        'Мульти-адмін доступ',
      ],
      badgeVariant: 'default' as const,
      popular: false,
    },
  ];

  const activeLicenses = [
    {
      key: 'SF-ENTERPRISE-ADMIN-0001',
      user: 'Super Administrator (admin@smartfeed.studio)',
      plan: 'ENTERPRISE',
      xmlLimit: '1,000,000',
      aiCredits: '5,000',
      backup: 'Увімкнено',
      expires: 'Безстроково',
    },
    {
      key: 'SF-PRO-DEMO-9900-1122',
      user: 'Demo Store Manager (demo@smartfeed.studio)',
      plan: 'PRO',
      xmlLimit: '50,000',
      aiCredits: '500',
      backup: 'Увімкнено',
      expires: '2027-12-31',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ліцензійні плани та підписки
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Керування квотами ліцензій, генерацією ключів та тарифами платформи
          </p>
        </div>
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col justify-between border-border/80 bg-card/60 backdrop-blur-sm shadow-md ${
              plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Zap className="w-3 h-3 fill-current" /> Популярний вибір
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <Badge
                  variant="outline"
                  className={
                    plan.name === 'ENTERPRISE'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : plan.name === 'PRO'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-secondary text-secondary-foreground'
                  }
                >
                  {plan.name}
                </Badge>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                {plan.period && (
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>

              <div className="mt-6 space-y-2.5">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <Button
                variant={plan.popular ? 'default' : 'outline'}
                size="sm"
                className="w-full h-9 border-border"
              >
                Налаштувати {plan.name}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Active License Keys Table */}
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-md overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Видані ліцензійні ключі</CardTitle>
          <CardDescription>
            Ліцензії, сформовані сервісом LicensesModule та збережені в базі даних
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Ліцензійний ключ</TableHead>
                <TableHead>Користувач</TableHead>
                <TableHead>План</TableHead>
                <TableHead>Ліміт XML</TableHead>
                <TableHead>AI Кредити</TableHead>
                <TableHead>Cloud Backup</TableHead>
                <TableHead className="text-right">Термін дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeLicenses.map((lic) => (
                <TableRow key={lic.key} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs text-primary font-semibold">
                    {lic.key}
                  </TableCell>
                  <TableCell className="text-xs text-foreground font-medium">{lic.user}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        lic.plan === 'ENTERPRISE'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : lic.plan === 'PRO'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-secondary text-secondary-foreground'
                      }
                    >
                      {lic.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{lic.xmlLimit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{lic.aiCredits}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
                    >
                      {lic.backup}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {lic.expires}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
