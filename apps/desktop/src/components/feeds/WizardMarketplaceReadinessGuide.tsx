import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Camera,
  Tag,
  FileText,
  Bot,
  CheckCircle2,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import {
  MarketplaceType,
  MARKETPLACE_TABS,
  CHECKLIST_ITEMS,
  getMarketplaceContent,
} from '@/components/feeds/marketplace-readiness.constants';

interface ChecklistState {
  importDone: boolean;
  attrsChecked: boolean;
  photosChecked: boolean;
  exportReady: boolean;
}

export function WizardMarketplaceReadinessGuide() {
  const { t } = useTranslation(['suppliers', 'common']);
  const [activeMarketplace, setActiveMarketplace] = useState<MarketplaceType>('ROZETKA');
  const [checklist, setChecklist] = useState<ChecklistState>({
    importDone: false,
    attrsChecked: false,
    photosChecked: false,
    exportReady: false,
  });
  const [isAutoSelecting, setIsAutoSelecting] = useState<boolean>(true);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAutoTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setIsAutoSelecting(false);
  }, []);

  const runAutoSequence = useCallback(() => {
    clearAutoTimers();
    setChecklist({
      importDone: false,
      attrsChecked: false,
      photosChecked: false,
      exportReady: false,
    });
    setIsAutoSelecting(true);

    const t1 = setTimeout(() => {
      setChecklist((prev) => ({ ...prev, importDone: true }));
    }, 400);

    const t2 = setTimeout(() => {
      setChecklist((prev) => ({ ...prev, attrsChecked: true }));
    }, 1100);

    const t3 = setTimeout(() => {
      setChecklist((prev) => ({ ...prev, photosChecked: true }));
    }, 1800);

    const t4 = setTimeout(() => {
      setChecklist((prev) => ({ ...prev, exportReady: true }));
      setIsAutoSelecting(false);
    }, 2500);

    timersRef.current = [t1, t2, t3, t4];
  }, [clearAutoTimers]);

  useEffect(() => {
    runAutoSequence();
    return () => clearAutoTimers();
  }, [runAutoSequence, clearAutoTimers]);

  const toggleChecklist = (key: keyof ChecklistState) => {
    clearAutoTimers();
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = useMemo(
    () => Object.values(checklist).filter(Boolean).length,
    [checklist],
  );
  const progressPercent = Math.round((completedCount / 4) * 100);
  const content = useMemo(
    () => getMarketplaceContent(activeMarketplace, t),
    [activeMarketplace, t],
  );

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3.5">
      {/* Header and Marketplace Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {t('suppliers:marketplaceReadinessTitle', {
                defaultValue: 'Підготовка товарів до вивантаження на маркетплейси',
              })}
            </h3>
            <Badge variant="outline" className="text-3xs font-mono bg-background">
              {content.tag}
            </Badge>
          </div>
          <p className="text-2xs text-muted-foreground">
            {t('suppliers:marketplaceReadinessDesc', {
              defaultValue:
                'Вимоги торгових майданчиків, які необхідно врахувати перед публікацією',
            })}
          </p>
        </div>

        {/* Marketplace Selection Tabs using shadcn Button */}
        <div className="flex items-center gap-1 p-0.5 bg-muted/40 rounded-md border border-border/60">
          {MARKETPLACE_TABS.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={activeMarketplace === tab.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveMarketplace(tab.id)}
              className={`h-7 text-2xs px-2.5 font-medium ${
                activeMarketplace === tab.id
                  ? 'bg-card text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(tab.labelKey, { defaultValue: tab.defaultLabel })}
            </Button>
          ))}
        </div>
      </div>

      {/* 4 Cards: Requirements for Selected Marketplace */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-md border border-border/60 bg-muted/15 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Camera className="size-3.5 text-muted-foreground" />
            <span>{t('suppliers:reqPhotoTitle', { defaultValue: 'Вимоги до фотографій' })}</span>
          </div>
          <p className="text-3xs text-muted-foreground leading-relaxed">{content.photoDesc}</p>
        </div>

        <div className="p-3 rounded-md border border-border/60 bg-muted/15 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Tag className="size-3.5 text-muted-foreground" />
            <span>
              {t('suppliers:reqAttrTitle', { defaultValue: "Обов'язкові характеристики" })}
            </span>
          </div>
          <p className="text-3xs text-muted-foreground leading-relaxed">{content.attrDesc}</p>
        </div>

        <div className="p-3 rounded-md border border-border/60 bg-muted/15 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <FileText className="size-3.5 text-muted-foreground" />
            <span>{t('suppliers:reqTitleTitle', { defaultValue: 'Назви та описи' })}</span>
          </div>
          <p className="text-3xs text-muted-foreground leading-relaxed">{content.titleDesc}</p>
        </div>

        <div className="p-3 rounded-md border border-border/60 bg-muted/25 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Bot className="size-3.5 text-muted-foreground" />
            <span>{t('suppliers:reqAiTipTitle', { defaultValue: 'SmartFeed AI-помічник' })}</span>
          </div>
          <p className="text-3xs text-muted-foreground leading-relaxed">
            {t('suppliers:reqAiTipDesc', {
              defaultValue:
                'Скористайтеся SmartFeed AI у каталозі, щоб згенерувати відсутні атрибути та перевірити назви перед експортом.',
            })}
          </p>
        </div>
      </div>

      {/* Interactive Readiness Checklist & Progress */}
      <div className="p-3 rounded-md border border-border/60 bg-muted/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <CheckCircle2 className="size-3.5 text-muted-foreground" />
            <span>
              {t('suppliers:readinessChecklistTitle', {
                defaultValue: 'Чеклист готовності каталогу',
              })}
            </span>
            {isAutoSelecting && (
              <Badge
                variant="outline"
                className="text-3xs font-normal gap-1 text-foreground border-border bg-muted/50 animate-pulse ml-1"
              >
                <Loader2 className="size-2.5 animate-spin" />
                <span>
                  {t('suppliers:autoVerifyingHint', {
                    defaultValue: 'Автоматична верифікація вимог маркетплейса…',
                  })}
                </span>
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={runAutoSequence}
              className="h-6 text-3xs px-2 gap-1 text-muted-foreground hover:text-foreground"
              title={t('suppliers:replayChecklist', { defaultValue: 'Повторити перевірку' })}
            >
              <RotateCcw className="size-2.5" />
              <span>{t('suppliers:replayChecklist', { defaultValue: 'Повторити перевірку' })}</span>
            </Button>
            <span className="text-2xs text-muted-foreground font-mono tabular-nums">
              {t('suppliers:readinessProgress', {
                completed: completedCount,
                total: 4,
                percent: progressPercent,
                defaultValue: `Готовність: ${completedCount}/4 (${progressPercent}%)`,
              })}
            </span>
            <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Checklist Buttons via mapped array */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checklist[item.key];
            return (
              <Button
                key={item.key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => toggleChecklist(item.key)}
                className={`h-auto p-2 justify-start text-left text-2xs border transition-all duration-300 ${
                  isChecked
                    ? 'bg-success/10 border-success/30 text-foreground font-medium shadow-2xs'
                    : 'bg-card border-border/60 text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                <div
                  className={`size-3.5 rounded flex items-center justify-center text-3xs shrink-0 mr-2 transition-all duration-300 ${
                    isChecked
                      ? 'bg-success text-success-foreground font-bold scale-105'
                      : 'border border-border bg-background'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </div>
                <span className="truncate">
                  {t(item.labelKey, { defaultValue: item.defaultLabel })}
                </span>
              </Button>
            );
          })}
        </div>

        {progressPercent === 100 && (
          <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-success text-3xs font-medium flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="size-3 shrink-0" />
            <span>
              {t('suppliers:readiness100Complete', {
                defaultValue: 'Всі вимоги маркетплейса виконано — каталог готовий до публікації!',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
