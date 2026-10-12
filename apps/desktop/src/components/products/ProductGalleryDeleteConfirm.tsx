import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';

export interface ProductGalleryDeleteConfirmProps {
  isOpen: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ProductGalleryDeleteConfirm({
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
}: ProductGalleryDeleteConfirmProps) {
  const { t } = useTranslation(['catalogs', 'common']);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-card/95 backdrop-blur-xs flex items-center justify-center p-6 z-20">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
          <Trash2 className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-foreground">
            {t('catalogs:deleteImageConfirmTitle')}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {t('catalogs:deleteImageConfirmDesc')}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            data-testid="confirm-delete-image-btn"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {t('catalogs:deleteImage')}
          </Button>
        </div>
      </div>
    </div>
  );
}
