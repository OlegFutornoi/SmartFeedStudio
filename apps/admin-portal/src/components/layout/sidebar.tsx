'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Layers,
  Database,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../ui/card';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Licenses & Plans', href: '/licenses', icon: KeyRound },
  { name: 'Cloud Snapshots', href: '/snapshots', icon: Database },
  { name: 'Catalog Feeds', href: '/feeds', icon: Layers },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-white">SmartFeed Studio</div>
          <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
            Admin Portal
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wider">
          Management
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* System Status footer */}
      <div className="p-4 border-t border-border bg-background/30">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-muted-foreground">API Services Connected</span>
        </div>
      </div>
    </aside>
  );
}
