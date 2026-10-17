import { createPortal } from 'react-dom';
import { AlertCircle, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';

interface QuotaExceededDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resourceName: string; // e.g. "Постачальники" or "Товари"
  currentCount: number;
  maxLimit: number;
  planName?: string;
}

export function QuotaExceededDialog({
  isOpen,
  onClose,
  resourceName,
  currentCount,
  maxLimit,
  planName,
}: QuotaExceededDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'plans']);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate('/plans');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 text-center relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto size-12 rounded-2xl bg-muted border border-border text-foreground flex items-center justify-center shadow-inner">
          <AlertCircle className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">
            {t('plans:quotaExceededTitle', {
              resource: resourceName,
              defaultValue: `Ліміт вичерпано: ${resourceName}`,
            })}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t('plans:quotaExceededDesc', {
              plan: planName ? `«${planName}»` : '',
              max: maxLimit,
              resource: resourceName.toLowerCase(),
              current: currentCount,
              defaultValue: `Ваш поточний тариф дозволяє використовувати до ${maxLimit} ${resourceName.toLowerCase()}. Ви вже використали ${currentCount}.`,
            })}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 text-xs text-left space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Sparkles className="size-4 shrink-0" />
            <span>
              {t('plans:quotaHowToIncrease', { defaultValue: 'Як збільшити доступну квоту?' })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('plans:quotaUpgradeAdvice', {
              defaultValue:
                'Перейдіть на вищий тарифний план (наприклад, Pro або Enterprise), щоб отримати більше постачальників, необмежені фіди та розширений SKU-каталог.',
            })}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t('common:cancel', { defaultValue: 'Скасувати' })}
          </Button>
          <Button
            size="sm"
            onClick={handleUpgrade}
            className="text-xs gap-1.5 shadow-md shadow-primary/25 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <span>{t('plans:viewPlansBtn', { defaultValue: 'Переглянути тарифи' })}</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
