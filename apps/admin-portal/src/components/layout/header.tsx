'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '../ui/button';

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card/30 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users, licenses, XML feeds..."
            className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
        </Button>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold border border-primary/30">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-foreground">Super Admin</div>
            <div className="text-[11px] text-muted-foreground">admin@smartfeed.studio</div>
          </div>
        </div>
      </div>
    </header>
  );
}
