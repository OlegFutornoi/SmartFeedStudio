'use client';

import React from 'react';
import { Shield, User } from 'lucide-react';
import { Role } from '@smartfeed/shared';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  selected: Role;
  onChange: (role: Role) => void;
  labels: {
    user: string;
    userDesc: string;
    admin: string;
    adminDesc: string;
  };
}

const ROLE_OPTIONS = [
  {
    value: Role.USER,
    icon: User,
    labelKey: 'user' as const,
    descKey: 'userDesc' as const,
    testId: 'role-option-user',
  },
  {
    value: Role.ADMIN,
    icon: Shield,
    labelKey: 'admin' as const,
    descKey: 'adminDesc' as const,
    testId: 'role-option-admin',
  },
] as const;

export const RoleSelector = React.memo(function RoleSelector({
  selected,
  onChange,
  labels,
}: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ROLE_OPTIONS.map((opt) => (
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
