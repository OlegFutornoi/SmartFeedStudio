import React from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

interface PreviewImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  productTitle: string;
  sku: string;
}

export const PreviewImageModal: React.FC<PreviewImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  productTitle,
  sku,
}) => {
  const { t } = useTranslation(['common']);

  if (!isOpen || !imageUrl) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
      data-testid="preview-image-modal"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with 100% Solid Opaque Background */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card shrink-0">
          <div className="min-w-0 pr-3">
            <h3 className="text-sm font-semibold text-foreground truncate" title={productTitle}>
              {productTitle}
            </h3>
            <span className="text-xs font-mono text-muted-foreground">{sku}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
            title={t('common:close', { defaultValue: 'Закрити' })}
            data-testid="close-preview-image-modal"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Large Image View */}
        <div className="p-4 bg-background/50 flex items-center justify-center min-h-64 max-h-[70vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={productTitle}
            className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-md border border-border/40"
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{sku}</span>
          {imageUrl.startsWith('http') && (
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              <span>{t('common:openOriginal', { defaultValue: 'Оригінал' })}</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
