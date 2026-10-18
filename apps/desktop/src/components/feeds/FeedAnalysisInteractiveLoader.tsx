import { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  CircleDashed,
  Clock,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

interface FeedAnalysisInteractiveLoaderProps {
  isAnalyzing: boolean;
}

const TIPS_KEYS = [
  'suppliers:analyzingTipCurrencies',
  'suppliers:analyzingTipQueue',
  'suppliers:analyzingTipDeduplication',
  'suppliers:analyzingTipCategories',
  'suppliers:analyzingTipSync',
] as const;

export function FeedAnalysisInteractiveLoader({ isAnalyzing }: FeedAnalysisInteractiveLoaderProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Live stopwatch timer
  useEffect(() => {
    if (!isAnalyzing) {
      setElapsedSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // Rotating tips ticker
  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS_KEYS.length);
    }, 3800);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  // Determine active phase based on elapsed seconds
  const phases = [
    {
      id: 'connecting',
      label: t('suppliers:analyzingPhaseConnecting', {
        defaultValue: "З'єднання з сервером постачальника та перевірка заголовків",
      }),
      isCompleted: elapsedSeconds >= 2,
      isActive: elapsedSeconds < 2,
    },
    {
      id: 'streaming',
      label: t('suppliers:analyzingPhaseStreaming', {
        defaultValue: 'Потокове завантаження XML/CSV структури фіду',
      }),
      isCompleted: elapsedSeconds >= 5,
      isActive: elapsedSeconds >= 2 && elapsedSeconds < 5,
    },
    {
      id: 'categories',
      label: t('suppliers:analyzingPhaseCategories', {
        defaultValue: 'Розпізнавання категорій, форматів (YML/XML/CSV) та атрибутів',
      }),
      isCompleted: elapsedSeconds >= 8,
      isActive: elapsedSeconds >= 5 && elapsedSeconds < 8,
    },
    {
      id: 'finalizing',
      label: t('suppliers:analyzingPhaseFinalizing', {
        defaultValue: 'Розрахунок залишків та формування попереднього перегляду',
      }),
      isCompleted: false,
      isActive: elapsedSeconds >= 8,
    },
  ];

  return (
    <div
      className="space-y-3.5 animate-in fade-in-50 duration-300"
      data-testid="feed-analysis-interactive-loader"
    >
      {/* Smart Assistant Card */}
      <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3.5">
        {/* Header with AI Badge & Timer */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-muted border border-border/60 text-primary flex items-center justify-center animate-pulse">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                {t('suppliers:analyzingSmartAssistant', {
                  defaultValue: 'SmartFeed AI Скенер',
                })}
              </h4>
              <p className="text-2xs text-muted-foreground">
                {t('suppliers:analyzingFeedProgressTitle', {
                  defaultValue: 'Завантаження та аналіз структури фіду…',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 text-foreground text-xs font-mono tabular-nums border border-border/60">
            <Clock className="size-3 text-muted-foreground" />
            <span>
              {t('suppliers:analyzingTimeElapsed', {
                seconds: elapsedSeconds,
                defaultValue: `Час аналізу: ${elapsedSeconds}с`,
              })}
            </span>
          </div>
        </div>

        {/* Live Step Progression */}
        <div className="space-y-2 py-1">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`flex items-center gap-2.5 text-xs transition-colors duration-200 ${
                phase.isCompleted
                  ? 'text-foreground font-normal'
                  : phase.isActive
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground/60'
              }`}
            >
              {phase.isCompleted ? (
                <CheckCircle2 className="size-3.5 text-success shrink-0" />
              ) : phase.isActive ? (
                <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
              ) : (
                <CircleDashed className="size-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span className="truncate">{phase.label}</span>
            </div>
          ))}
        </div>

        {/* Dynamic Rotating Tips Bar */}
        <div className="rounded-md bg-muted/30 border border-border/50 p-2.5 flex items-start gap-2.5 text-2xs text-muted-foreground">
          <Lightbulb className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1 transition-opacity duration-300">
            <span>{t(TIPS_KEYS[tipIndex])}</span>
          </div>
        </div>

        {/* Long Running Alert for Huge Feeds (> 12s) */}
        {elapsedSeconds >= 12 && (
          <div className="rounded-md bg-muted/50 border border-border/60 p-2.5 flex items-start gap-2 text-2xs text-foreground animate-in fade-in-50">
            <AlertTriangle className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p>
              {t('suppliers:largeFeedTimeoutHint', {
                defaultValue:
                  'Каталог дуже великий або сервер постачальника повільний. Якщо аналіз триває задовго, ви можете завантажити файл на ПК та імпортувати через вкладку «Завантажити файл».',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Shimmering Skeleton of Upcoming Analysis Card (Eliminating empty void) */}
      <div className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 rounded-md bg-muted animate-pulse" />
          <div className="h-5 w-20 rounded-md bg-muted animate-pulse" />
        </div>

        {/* 3 Metric Cards Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-md border border-border/40 bg-muted/20 space-y-2">
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          </div>
          <div className="p-3 rounded-md border border-border/40 bg-muted/20 space-y-2">
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            <div className="h-6 w-14 rounded bg-muted animate-pulse" />
          </div>
          <div className="p-3 rounded-md border border-border/40 bg-muted/20 space-y-2">
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            <div className="h-6 w-14 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Categories Placeholder Rows Skeleton */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 rounded-md bg-muted/30 border border-border/30 animate-pulse" />
            <div className="h-8 rounded-md bg-muted/30 border border-border/30 animate-pulse" />
            <div className="h-8 rounded-md bg-muted/30 border border-border/30 animate-pulse" />
            <div className="h-8 rounded-md bg-muted/30 border border-border/30 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
