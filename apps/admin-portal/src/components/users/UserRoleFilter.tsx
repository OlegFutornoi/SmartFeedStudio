'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '../ui/button';

interface UserRoleFilterProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
}

const ROLES = ['ALL', 'SUPER_ADMIN', 'ADMIN', 'USER'] as const;

export const UserRoleFilter = React.memo(function UserRoleFilter({
  selectedRole,
  onSelectRole,
}: UserRoleFilterProps) {
  return (
    <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
      <span className="text-xs text-muted-foreground mr-1 flex items-center shrink-0">
        <Filter className="h-3.5 w-3.5 mr-1" />
        Роль:
      </span>
      {ROLES.map((role) => (
        <Button
          key={role}
          variant={selectedRole === role ? 'default' : 'outline'}
          size="sm"
          className={`h-8 text-xs px-2.5 ${
            selectedRole === role
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onSelectRole(role)}
        >
          {role === 'ALL' ? 'Всі' : role}
        </Button>
      ))}
    </div>
  );
});
