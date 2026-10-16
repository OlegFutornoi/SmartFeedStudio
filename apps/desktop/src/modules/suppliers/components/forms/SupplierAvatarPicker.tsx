import React, { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Camera, Sparkles, Trash2, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SupplierAvatar } from '@/modules/suppliers/components/common/SupplierAvatar';
import { optimizeAvatarImage } from '@/services/localUserProfile';
import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

export interface SupplierAvatarPickerProps {
  logoUrl?: string | null;
  name: string;
  website?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export const SupplierAvatarPicker: React.FC<SupplierAvatarPickerProps> = ({
  logoUrl,
  name,
  website,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanDomain = (url?: string): string | null => {
    if (!url) return null;
    try {
      const formatted = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(formatted);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  };

  const domain = cleanDomain(website);

  const processFile = async (file: File) => {
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

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleFetchDomainLogo = () => {
    if (!domain) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      // High-res multi-source favicon resolution
      const remoteLogoUrl = `https://unavatar.io/${domain}?fallback=https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      onChange(remoteLogoUrl);
    } catch (err) {
      console.warn('[SupplierAvatarPicker] Domain logo error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setShowUrlInput(false);
      setCustomUrl('');
    }
  };

  const handleRemove = () => {
    setErrorMsg(null);
    onChange(null);
  };

  return (
    <div className="space-y-2.5" data-testid="supplier-avatar-picker">
      <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-border/70 bg-card/60 shadow-xs transition-colors">
        {/* Interactive Avatar with Hover Camera overlay */}
        <div
          onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'relative group size-16 rounded-2xl shrink-0 cursor-pointer overflow-hidden border-2 border-dashed transition-all duration-200 flex items-center justify-center select-none',
            isDragging
              ? 'border-primary bg-primary/10 scale-105'
              : 'border-border/80 hover:border-primary/60 hover:shadow-md',
            (disabled || isProcessing) && 'cursor-not-allowed opacity-60',
          )}
          title={t('suppliers:avatarUploadHint', {
            defaultValue: 'Клікніть або перетягніть логотип',
          })}
          data-testid="supplier-avatar-interactive-preview"
        >
          <SupplierAvatar
            logoUrl={logoUrl}
            name={name || 'S'}
            size="lg"
            className="size-full rounded-none"
            dataTestId="supplier-form-avatar-preview"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-background/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-foreground">
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <>
                <Camera className="size-4 text-primary" />
                <span className="text-3xs font-medium uppercase tracking-wider">
                  {logoUrl ? 'Змінити' : 'Завантажити'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls & Domain Assistant */}
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
              className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer rounded-lg hover:border-primary/50"
              data-testid="supplier-avatar-upload-btn"
            >
              <Camera className="size-3.5 text-muted-foreground" />
              {logoUrl
                ? t('suppliers:changeLogo', { defaultValue: 'Змінити фото' })
                : t('suppliers:uploadLogo', { defaultValue: 'Обрати файл' })}
            </Button>

            {domain && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled || isProcessing}
                onClick={handleFetchDomainLogo}
                className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer rounded-lg text-primary bg-primary/10 hover:bg-primary/20"
                title={`Пошук логотипу для ${domain}`}
                data-testid="supplier-avatar-fetch-domain-btn"
              >
                <Sparkles className="size-3.5 text-primary" />
                {t('suppliers:fetchDomainLogo', { defaultValue: 'Підтягнути з сайту' })}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isProcessing}
              onClick={() => setShowUrlInput((v) => !v)}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Вставити посилання на логотип"
              data-testid="supplier-avatar-url-toggle-btn"
            >
              <Link2 className="size-3" />
              URL
            </Button>

            {logoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isProcessing}
                onClick={handleRemove}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
                data-testid="supplier-avatar-remove-btn"
              >
                <Trash2 className="size-3.5" />
                {t('common:delete', { defaultValue: 'Видалити' })}
              </Button>
            )}
          </div>

          <p className="text-2xs text-muted-foreground">
            {t('suppliers:avatarUploadHint', { defaultValue: 'Клікніть або перетягніть логотип' })}
            {domain && ` • Визначено домен: ${domain}`}
          </p>

          {/* Collapsible Direct URL Input */}
          {showUrlInput && (
            <div className="flex items-center gap-1.5 pt-1.5 animate-in fade-in-50 duration-150">
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://company.com/logo.png"
                className="h-7 text-xs bg-background/90 flex-1"
                data-testid="supplier-avatar-url-input"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleApplyCustomUrl}
                className="h-7 px-2.5 text-xs cursor-pointer"
                data-testid="supplier-avatar-apply-url-btn"
              >
                Застосувати
              </Button>
            </div>
          )}
        </div>
      </div>
      {errorMsg && <p className="text-2xs text-destructive">{errorMsg}</p>}
    </div>
  );
};
