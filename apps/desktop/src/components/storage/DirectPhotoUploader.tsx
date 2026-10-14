import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { StorageFileCategory, type StorageFileDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useStorageQuota } from '@/hooks/useStorageQuota';
import { uploadDirectToS3, confirmStorageUpload } from '@/services/storage';
import { Progress } from '@/components/ui/progress';
import { UpgradeStoragePromptDialog } from '@/components/storage/UpgradeStoragePromptDialog';
import { cn } from '@/lib/utils';

export interface DirectPhotoUploaderProps {
  productId?: string;
  onSuccess?: (file: StorageFileDto) => void;
  onError?: (err: string) => void;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function DirectPhotoUploader({
  productId,
  onSuccess,
  onError,
  className,
}: DirectPhotoUploaderProps) {
  const { t } = useTranslation(['storage', 'common']);
  const { token } = useAuth();
  const { isLocked, isOverQuota, refetch: refetchQuota } = useStorageQuota();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFile, setSuccessFile] = useState<StorageFileDto | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setSuccessFile(null);

      // 1. Validate MIME format
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        const err = t('storage:invalidFileType');
        setErrorMessage(err);
        onError?.(err);
        return;
      }

      // 2. Validate max size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const err = t('storage:fileTooLarge');
        setErrorMessage(err);
        onError?.(err);
        return;
      }

      // 3. Check storage quota gate
      if (isLocked || isOverQuota) {
        setShowUpgradeModal(true);
        return;
      }

      if (!token) {
        setErrorMessage('Authentication required');
        return;
      }

      try {
        setIsUploading(true);
        setProgress(0);

        // 4. Request presigned URL and upload directly to Cloudflare R2 / S3
        const { s3Key } = await uploadDirectToS3({
          file,
          fileName: file.name,
          contentType: file.type,
          accessToken: token,
          folder: productId ? `products/${productId}` : 'products',
          onProgress: (p) => setProgress(p),
        });

        // 5. Confirm upload with backend to register DB record and update quota
        const confirmed = await confirmStorageUpload(token, {
          s3Key,
          category: StorageFileCategory.PRODUCT_IMAGE,
          originalName: file.name,
        });

        setSuccessFile(confirmed);
        setProgress(100);
        await refetchQuota();
        onSuccess?.(confirmed);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setErrorMessage(msg);
        onError?.(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [token, isLocked, isOverQuota, productId, onSuccess, onError, refetchQuota, t],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div data-testid="direct-photo-uploader" className={cn('space-y-3', className)}>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-card',
          isUploading && 'cursor-wait opacity-80',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          className="hidden"
          onChange={onFileChange}
          disabled={isUploading}
          data-testid="photo-dropzone-input"
        />

        {isUploading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-center gap-2 text-primary font-medium text-xs">
              <UploadCloud className="size-4 animate-bounce" />
              <span>{t('storage:uploading', { percent: progress })}</span>
            </div>
            <Progress
              value={progress}
              className="h-2 w-full max-w-xs mx-auto bg-muted"
              indicatorClassName="bg-primary"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
              <ImageIcon className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{t('storage:dropzoneTitle')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('storage:dropzoneHint')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error feedback */}
      {errorMessage && (
        <div
          data-testid="upload-error-banner"
          className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success feedback */}
      {successFile && (
        <div
          data-testid="upload-success-banner"
          className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            <span className="truncate max-w-[240px]">
              {t('storage:uploadSuccess')} ({successFile.originalName})
            </span>
          </div>
          <span className="text-2xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            CDN
          </span>
        </div>
      )}

      <UpgradeStoragePromptDialog
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        isOverQuota={isOverQuota}
      />
    </div>
  );
}
