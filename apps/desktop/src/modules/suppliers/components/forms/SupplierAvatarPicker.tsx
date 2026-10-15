import React, { useRef, useState, type ChangeEvent } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierAvatar } from '@/modules/suppliers/components/common/SupplierAvatar';
import { optimizeAvatarImage } from '@/services/localUserProfile';
import { useTranslation } from '@/i18n';

export interface SupplierAvatarPickerProps {
  logoUrl?: string | null;
  name: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export const SupplierAvatarPicker: React.FC<SupplierAvatarPickerProps> = ({
  logoUrl,
  name,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg(
        t('suppliers:avatarImageError', { defaultValue: 'Будь ласка, оберіть файл зображення' }),
      );
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      const optimizedDataUrl = await optimizeAvatarImage(file);
      onChange(optimizedDataUrl);
    } catch (err) {
      console.warn('[SupplierAvatarPicker] Error processing avatar:', err);
      setErrorMsg(
        t('suppliers:avatarOptimizeError', { defaultValue: 'Не вдалося обробити логотип' }),
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setErrorMsg(null);
    onChange(null);
  };

  return (
    <div className="space-y-2" data-testid="supplier-avatar-picker">
      <label className="text-xs font-medium text-foreground block">
        {t('suppliers:formLogoTitle', { defaultValue: 'Логотип постачальника' })}
      </label>
      <div className="flex items-center gap-4 p-3 rounded-xl border border-border/70 bg-card/50">
        <SupplierAvatar
          logoUrl={logoUrl}
          name={name || 'V'}
          size="lg"
          dataTestId="supplier-form-avatar-preview"
        />

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled || isProcessing}
              data-testid="supplier-avatar-file-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="h-7.5 text-xs gap-1.5 cursor-pointer"
              data-testid="supplier-avatar-upload-btn"
            >
              {isProcessing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {logoUrl
                ? t('suppliers:changeLogo', { defaultValue: 'Змінити логотип' })
                : t('suppliers:uploadLogo', { defaultValue: 'Завантажити фото' })}
            </Button>

            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isProcessing}
                onClick={handleRemove}
                className="h-7.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                data-testid="supplier-avatar-remove-btn"
              >
                <Trash2 className="size-3.5" />
                {t('common:delete', { defaultValue: 'Видалити' })}
              </Button>
            )}
          </div>
          <p className="text-2xs text-muted-foreground">
            {t('suppliers:logoHint', {
              defaultValue: 'Формати PNG, JPG, WebP. Автоматично стискається для бази додатку.',
            })}
          </p>
        </div>
      </div>
      {errorMsg && <p className="text-2xs text-destructive">{errorMsg}</p>}
    </div>
  );
};
