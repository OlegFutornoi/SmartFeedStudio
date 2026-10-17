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
      className="rounded-2xl border border-primary/20 bg-gradient-to-b from-card/80 via-card/50 to-background p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* AI Agent Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* 3D Agent Avatar with Pulsing Radar Ring */}
          <div className="relative size-11 sm:size-12 shrink-0">
            <div className="size-full overflow-hidden rounded-xl border border-primary/30 bg-background shadow-xs ring-2 ring-primary/20">
              <img
                src={avatarUrl}
                alt={name || 'SmartFeed AI Copilot'}
                className="size-full object-cover"
              />
            </div>
            {/* Live Online Ping Indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success ring-2 ring-background shadow-xs" />
            </span>
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                {name || 'SmartFeed AI Copilot'}
              </h4>
              <Badge
                variant="outline"
                className="gap-1 border-primary/30 bg-primary/10 px-2 py-0 text-3xs font-semibold text-primary"
              >
                <Sparkles className="size-2.5" />
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
          className="border-success/30 bg-success/10 text-success text-2xs font-medium px-2 py-0.5 ml-auto sm:ml-0"
        >
          <Bot className="size-3 mr-1" />
          {t('suppliers:aiAutopilotActive', { defaultValue: 'Автопілот аналізу готовий' })}
        </Badge>
      </div>

      {/* 4 Capability Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {aiFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className="p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-colors space-y-1.5 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {feat.title}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-3xs px-1.5 py-0 font-mono text-muted-foreground bg-background/50"
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

      {/* Free Quotas Banner & Upsell Pitch */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary shrink-0" />
          <span className="text-2xs sm:text-xs text-foreground">
            {t('suppliers:aiFreeQuotaNotice', {
              defaultValue:
                'У ваш план включено 50 AI-збагачень товарів. Автопілот візьме на себе всю монотонну рутину.',
            })}
          </span>
        </div>
        <div className="text-3xs font-medium text-primary flex items-center gap-1 shrink-0 ml-auto">
          <span>
            {t('suppliers:aiAutoEnrichOnImport', { defaultValue: 'Доступно під час імпорту' })}
          </span>
          <ArrowRight className="size-3" />
        </div>
      </div>
    </div>
  );
}
