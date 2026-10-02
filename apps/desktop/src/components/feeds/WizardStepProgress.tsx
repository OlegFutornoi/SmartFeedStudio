import { ImportFeedResultDto } from '@/lib/api';
import { CheckCircle2, Loader2, ShoppingBag, Layers, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

interface WizardStepProgressProps {
  isImporting: boolean;
  result: ImportFeedResultDto | null;
  error: string | null;
}

export function WizardStepProgress({ isImporting, result, error }: WizardStepProgressProps) {
  const { t } = useTranslation(['suppliers', 'common']);

  if (isImporting) {
    return (
      <div className="py-8 text-center space-y-4">
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
      <div className="py-6 text-center space-y-3">
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
      <div className="py-4 space-y-4">
        <div className="text-center space-y-2">
          <div className="size-12 rounded-full bg-muted border border-border text-foreground flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="text-sm font-semibold text-foreground">
            {t('suppliers:importSuccessTitle', { defaultValue: 'Імпорт успішно завершено!' })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('suppliers:importSuccessSubtitle', {
              defaultValue: 'Товари синхронізовано та додано до вашого каталогу',
            })}
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-center">
            <ShoppingBag className="size-4 text-foreground mx-auto mb-1" />
            <div className="text-[11px] text-muted-foreground">Створено товарів</div>
            <div className="text-base font-bold text-foreground font-mono mt-0.5">
              +{result.createdItems}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-center">
            <RefreshCw className="size-4 text-primary mx-auto mb-1" />
            <div className="text-[11px] text-muted-foreground">Оновлено цін/залишків</div>
            <div className="text-base font-bold text-foreground font-mono mt-0.5">
              {result.updatedItems}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-center">
            <Layers className="size-4 text-primary mx-auto mb-1" />
            <div className="text-[11px] text-muted-foreground">Категорій</div>
            <div className="text-base font-bold text-foreground font-mono mt-0.5">
              +{result.categoriesCreated}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Формат:</span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {result.format}
          </Badge>
        </div>
      </div>
    );
  }

  return null;
}
