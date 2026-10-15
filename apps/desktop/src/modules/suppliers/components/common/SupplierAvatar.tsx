import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface SupplierAvatarProps {
  logoUrl?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  dataTestId?: string;
}

const sizeClasses = {
  xs: 'size-6 text-3xs rounded-md',
  sm: 'size-8 text-xs rounded-lg',
  md: 'size-10 text-sm rounded-xl',
  lg: 'size-14 text-xl rounded-2xl',
  xl: 'size-16 text-2xl rounded-2xl',
};

export const SupplierAvatar: React.FC<SupplierAvatarProps> = ({
  logoUrl,
  name = 'V',
  size = 'md',
  className,
  dataTestId,
}) => {
  const [hasError, setHasError] = useState(false);

  const initials = (name || 'V')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const showImage = Boolean(logoUrl) && !hasError;

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center font-bold overflow-hidden select-none',
        'border border-primary/20 bg-primary/10 text-primary shadow-xs',
        sizeClasses[size],
        className,
      )}
      data-testid={dataTestId}
    >
      {showImage ? (
        <img
          src={logoUrl!}
          alt={name}
          className="size-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
