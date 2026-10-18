import { useAiAssistantProfile } from '@/hooks/useAiAssistantProfile';
import { useTranslation } from '@/i18n';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Sparkles,
  Layers,
  ShieldCheck,
  Image as ImageIcon,
  Wand2,
  ArrowRight,
} from 'lucide-react';

export function WizardAiAssistantShowcase() {
  const { t } = useTranslation(['suppliers', 'common']);
  const { avatarUrl, name, roleUk } = useAiAssistantProfile();

  const aiFeatures = [
    {
      id: 'category-mapping',
      icon: Layers,
      title: t('suppliers:aiFeatureCategoryMappingTitle', {
        defaultValue: 'Авто-маппінг категорій',
      }),
      description: t('suppliers:aiFeatureCategoryMappingDesc', {
        defaultValue:
          'Миттєво зв’язує рубрики прайсу з деревом категорій Rozetka, Prom та Epicentr без ручної праці.',
      }),
      tag: t('suppliers:aiFeatureCategoryMappingTag', { defaultValue: '100% точність' }),
    },
    {
      id: 'reverse-margin',
      icon: ShieldCheck,
      title: t('suppliers:aiFeatureReverseMarginTitle', {
        defaultValue: 'Захист маржі від комісій',
      }),
      description: t('suppliers:aiFeatureReverseMarginDesc', {
        defaultValue:
          'Розраховує зворотний відсоток для кожної категорії, гарантуючи отримання запланованого чистого прибутку.',
      }),
      tag: t('suppliers:aiFeatureReverseMarginTag', { defaultValue: 'Анти-збиток' }),
    },
    {
      id: 'photo-audit',
      icon: ImageIcon,
      title: t('suppliers:aiFeaturePhotoAuditTitle', {
        defaultValue: 'Контроль студійних фото',
      }),
      description: t('suppliers:aiFeaturePhotoAuditDesc', {
        defaultValue:
          'Аудит фото на білому фоні, відсіювання 404 посилань та підготовка до жорсткої модерації маркетплейсів.',
      }),
      tag: t('suppliers:aiFeaturePhotoAuditTag', { defaultValue: 'Стандарт Rozetka' }),
    },
    {
      id: 'seo-enrichment',
      icon: Wand2,
      title: t('suppliers:aiFeatureSeoTitle', {
        defaultValue: 'SEO та атрибути товару',
      }),
      description: t('suppliers:aiFeatureSeoDesc', {
        defaultValue:
          'Генерація україномовних назв, характеристик та описів товарів для максимальної видачі у пошуку.',
      }),
      tag: t('suppliers:aiFeatureSeoTag', { defaultValue: 'AI Копірайтер' }),
    },
  ];

  return (
    <div
      data-testid="wizard-ai-copilot-showcase"
      className="rounded-lg border border-border/60 bg-card overflow-hidden"
    >
      {/* AI Agent Compact Header Strip */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 bg-muted/20 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative size-8 shrink-0">
            <div className="size-full overflow-hidden rounded-md border border-border/60 bg-background">
              <img
                src={avatarUrl}
                alt={name || 'SmartFeed AI Copilot'}
                className="size-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success ring-2 ring-card" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold text-foreground">
                {name || 'SmartFeed AI Copilot'}
              </h4>
              <Badge
                variant="outline"
                className="gap-1 border-border/60 bg-background px-1.5 py-0 text-3xs font-mono text-muted-foreground"
              >
                <Sparkles className="size-2.5 text-primary" />
                <span>AI 2.0</span>
              </Badge>
            </div>
            <p className="text-2xs text-muted-foreground truncate">
              {roleUk ||
                t('suppliers:aiCopilotRole', {
                  defaultValue: 'Персональний AI-аналітик ваших каталогів',
                })}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="border-success/30 bg-success/15 text-success text-2xs font-medium px-2 py-0.5 ml-auto sm:ml-0"
        >
          <Bot className="size-3 mr-1" />
          {t('suppliers:aiAutopilotActive', { defaultValue: 'Автопілот аналізу готовий' })}
        </Badge>
      </div>

      {/* 2x2 Architectural Capability Matrix (Hairline Dividers, Zero Nested Border Clutter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/40">
        {aiFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className="p-3.5 bg-card hover:bg-muted/15 transition-colors space-y-1.5 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-6 rounded-md bg-muted/60 border border-border/50 text-muted-foreground flex items-center justify-center shrink-0">
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium text-foreground leading-tight truncate">
                      {feat.title}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-3xs px-1.5 py-0 font-mono text-muted-foreground bg-muted/30 border-border/50 shrink-0"
                  >
                    {feat.tag}
                  </Badge>
                </div>
                <p className="text-2xs text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Single-Line Quota Notice Footer */}
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span className="text-2xs text-muted-foreground">
            {t('suppliers:aiFreeQuotaNotice', {
              defaultValue:
                'У ваш план включено 50 AI-збагачень товарів. Автопілот візьме на себе всю монотонну рутину.',
            })}
          </span>
        </div>
        <div className="text-3xs font-medium text-foreground flex items-center gap-1 shrink-0 ml-auto">
          <span>
            {t('suppliers:aiAutoEnrichOnImport', { defaultValue: 'Доступно під час імпорту' })}
          </span>
          <ArrowRight className="size-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
