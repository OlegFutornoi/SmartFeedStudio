import { ImportFeedResultDto } from '@/lib/api';
import { CheckCircle2, Loader2, ShoppingBag, Layers, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';
import { WizardMarketplaceReadinessGuide } from '@/components/feeds/WizardMarketplaceReadinessGuide';

interface WizardStepProgressProps {
  isImporting: boolean;
  result: ImportFeedResultDto | null;
  error: string | null;
}

export function WizardStepProgress({ isImporting, result, error }: WizardStepProgressProps) {
  const { t } = useTranslation(['suppliers', 'common']);

  if (isImporting) {
    return (
      <div className="py-12 text-center space-y-4">
        <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto animate-pulse">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">
            {t('suppliers:importInProgressTitle', { defaultValue: 'Триває імпорт товарів...' })}
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t('suppliers:importInProgressHint', {
              defaultValue:
                'Зчитування категорій, розрахунок націнок, збереження атрибутів та фотографій у каталог.',
            })}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <RefreshCw className="size-6" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold text-destructive">
            {t('suppliers:importFailedTitle', { defaultValue: 'Помилка імпорту' })}
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-3.5 py-1">
        {/* Compact Result Banner with Real Metrics */}
        <div className="p-3.5 rounded-2xl border border-border/80 bg-card shadow-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-success/15 border border-success/30 text-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span>
                  {t('suppliers:importSuccessTitle', {
                    defaultValue: 'Імпорт успішно завершено!',
                  })}
                </span>
                <Badge variant="outline" className="font-mono text-3xs bg-background">
                  {t('suppliers:formatLabel', { defaultValue: 'Формат:' })} {result.format}
                </Badge>
              </div>
              <p className="text-2xs text-muted-foreground">
                {t('suppliers:importSuccessSubtitle', {
                  defaultValue: 'Товари синхронізовано та додано до вашого каталогу',
                })}
              </p>
            </div>
          </div>

          {/* Real Metrics Badges (Matches actual selected SKU count, zero false 7000 duplicates) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-secondary/35 border border-border/60 text-center">
              <div className="text-3xs text-muted-foreground flex items-center gap-1 justify-center">
                <ShoppingBag className="size-3 text-primary" />
                <span>
                  {t('suppliers:createdItemsLabel', { defaultValue: 'Створено товарів' })}
                </span>
              </div>
              <div className="text-xs font-bold text-foreground font-mono mt-0.5">
                +{result.createdItems.toLocaleString('uk-UA')}
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-secondary/35 border border-border/60 text-center">
              <div className="text-3xs text-muted-foreground flex items-center gap-1 justify-center">
                <RefreshCw className="size-3 text-muted-foreground" />
                <span>
                  {t('suppliers:updatedItemsLabel', { defaultValue: 'Оновлено цін/залишків' })}
                </span>
              </div>
              <div className="text-xs font-bold text-foreground font-mono mt-0.5">
                {result.updatedItems}
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-secondary/35 border border-border/60 text-center">
              <div className="text-3xs text-muted-foreground flex items-center gap-1 justify-center">
                <Layers className="size-3 text-primary" />
                <span>{t('suppliers:categoriesCreatedLabel', { defaultValue: 'Категорій' })}</span>
              </div>
              <div className="text-xs font-bold text-foreground font-mono mt-0.5">
                +{result.categoriesCreated}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Marketplace Preparation Hub (Fills dead space with high-value guidance) */}
        <WizardMarketplaceReadinessGuide />
      </div>
    );
  }

  return null;
}
