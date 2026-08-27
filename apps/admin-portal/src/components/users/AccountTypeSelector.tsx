'use client';

import React from 'react';
import { Building2, UserCheck } from 'lucide-react';
import { AccountType } from '@smartfeed/shared';
import { cn } from '../../lib/utils';

interface AccountTypeSelectorProps {
  selected: AccountType;
  onChange: (type: AccountType) => void;
  labels: {
    owner: string;
    ownerDesc: string;
    member: string;
    memberDesc: string;
  };
}

const ACCOUNT_OPTIONS = [
  {
    value: AccountType.OWNER,
    icon: Building2,
    labelKey: 'owner' as const,
    descKey: 'ownerDesc' as const,
    testId: 'account-type-owner',
  },
  {
    value: AccountType.MEMBER,
    icon: UserCheck,
    labelKey: 'member' as const,
    descKey: 'memberDesc' as const,
    testId: 'account-type-member',
  },
] as const;

export const AccountTypeSelector = React.memo(function AccountTypeSelector({
  selected,
  onChange,
  labels,
}: AccountTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ACCOUNT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-testid={opt.testId}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all',
            selected === opt.value
              ? 'border-primary bg-primary/8 text-primary shadow-sm'
              : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border',
          )}
        >
          <opt.icon className="size-4 shrink-0" />
          <span className="text-[11px] font-semibold leading-tight">{labels[opt.labelKey]}</span>
          <span className="text-[10px] leading-tight opacity-70">{labels[opt.descKey]}</span>
        </button>
      ))}
    </div>
  );
});
