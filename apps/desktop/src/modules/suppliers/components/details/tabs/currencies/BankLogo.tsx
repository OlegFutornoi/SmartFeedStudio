import React, { useState, useEffect } from 'react';
import { getBankLogoSrc } from '@/lib/services/bankLogoCache';

interface BankLogoProps {
  bankId: string;
  bankName: string;
  logoUrl?: string | null;
  updatedAt?: string;
  className?: string;
}

export const BankLogo: React.FC<BankLogoProps> = ({
  bankId,
  bankName,
  logoUrl,
  updatedAt,
  className = '',
}) => {
  const [src, setSrc] = useState<string>(() => getBankLogoSrc(bankId, logoUrl, updatedAt));

  useEffect(() => {
    setSrc(getBankLogoSrc(bankId, logoUrl, updatedAt));
  }, [bankId, logoUrl, updatedAt]);

  return (
    <div
      className={`size-5 min-w-5 max-w-5 min-h-5 max-h-5 rounded-md shrink-0 overflow-hidden flex items-center justify-center border border-border/40 bg-muted/20 shadow-2xs ${className}`}
      style={{ width: 20, height: 20, minWidth: 20, minHeight: 20, maxWidth: 20, maxHeight: 20 }}
    >
      <img
        src={src}
        alt={bankName}
        className="size-5 block object-contain pointer-events-none select-none"
        style={{ width: 20, height: 20, minWidth: 20, minHeight: 20, maxWidth: 20, maxHeight: 20 }}
        onError={() => {
          setSrc(getBankLogoSrc(bankId));
        }}
      />
    </div>
  );
};
