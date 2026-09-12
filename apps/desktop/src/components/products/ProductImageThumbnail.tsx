import React, { useState } from 'react';
import { Package, ImageOff } from 'lucide-react';
import type { LocalProductImageDto, ProductImageDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';
import { resolveImageSrc } from '@/lib/image-url';

export interface ProductImageThumbnailProps {
  image?: LocalProductImageDto | ProductImageDto | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  imageClassName?: string;
  dataTestId?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-48 w-full',
  custom: '',
};

export const ProductImageThumbnail: React.FC<ProductImageThumbnailProps> = ({
  image,
  alt,
  size = 'md',
  className = '',
  imageClassName = '',
  dataTestId,
}) => {
  const { t } = useTranslation(['catalogs']);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Resolves thumbnail -> local path -> cloud url -> original url
  const resolvedSrc = resolveImageSrc(
    image?.thumbnailPath || image?.localPath,
    image?.cloudUrl || image?.originalUrl,
  );

  const containerSize = sizeClasses[size];

  if (!resolvedSrc || hasError) {
    return (
      <div
        data-testid={dataTestId || 'product-image-fallback'}
        className={`rounded-lg overflow-hidden bg-muted/40 border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground/40 ${containerSize} ${className}`}
        title={hasError ? t('catalogs:imageUnavailable') : alt}
      >
        {hasError ? (
          <ImageOff className="h-4 w-4 opacity-70" />
        ) : (
          <Package className="h-4 w-4 opacity-50" />
        )}
      </div>
    );
  }

  return (
    <div
      data-testid={dataTestId || 'product-image-container'}
      className={`relative rounded-lg overflow-hidden bg-muted/30 border border-border/60 flex items-center justify-center shrink-0 ${containerSize} ${className}`}
    >
      {isLoading && <div className="absolute inset-0 bg-muted/50 animate-pulse" />}
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`h-full w-full object-cover transition-transform duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${imageClassName}`}
      />
    </div>
  );
};
