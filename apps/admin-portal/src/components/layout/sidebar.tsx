'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Settings,
  LogOut,
  Layers,
  ShieldCheck,
  Key,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ChangePasswordDialog } from '../profile/change-password-dialog';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const navigation = [
    { name: 'Дашборд', href: '/', icon: LayoutDashboard },
    { name: 'Користувачі', href: '/users', icon: Users },
    { name: 'Ліцензії', href: '/licenses', icon: KeyRound },
    { name: 'Навігація меню', href: '/navigation', icon: Compass },
    { name: 'Налаштування', href: '/settings', icon: Settings },
  ];

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const renderNavItems = () => (
    <nav className="space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden py-2">
      {!isCollapsed && (
        <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
          Головне меню
        </div>
      )}
      {navigation.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={closeMobileSidebar}
            title={isCollapsed ? item.name : undefined}
            className={cn(
              'flex items-center rounded-xl text-sm font-medium transition-all group relative',
              isCollapsed ? 'justify-center h-10 w-10 mx-auto px-0' : 'space-x-3 px-3 py-2.5',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col justify-between h-screen sticky top-0 border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 z-20 select-none',
          isCollapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="p-3 flex flex-col flex-1 min-h-0">
          {/* Header & Logo */}
          <div
            className={cn(
              'flex items-center mb-6 pb-2 border-b border-border/40',
              isCollapsed ? 'justify-center pt-2' : 'justify-between px-2 pt-2',
            )}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Layers className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-foreground tracking-tight text-base truncate">
                      SmartFeed
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 border-primary/40 text-primary"
                    >
                      Admin
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">Management</p>
                </div>
              )}
            </div>

            {/* Direct Collapse/Expand Toggle Button in Header */}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
                onClick={toggleSidebar}
                title="Згорнути бокове меню"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          {renderNavItems()}
        </div>

        {/* Collapsed Rail Toggle Button (Bottom) */}
        {isCollapsed && (
          <div className="p-2 border-t border-border/40 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg"
              onClick={toggleSidebar}
              title="Розгорнути бокове меню"
            >
              <PanelLeftOpen className="h-4 w-4 text-primary" />
            </Button>
          </div>
        )}

        {/* User Profile Footer (sidebar-07 style) */}
        <div className="p-3 border-t border-border/80 bg-card/60">
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-3 mb-3 px-1">
                <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {getInitials(user?.fullName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {user?.fullName || 'Адміністратор'}
                    </p>
                    <ShieldCheck className="h-3 w-3 text-primary shrink-0" />
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {user?.email || 'admin@gmail.com'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2 justify-center border-border hover:bg-muted/80"
                  onClick={() => setPasswordDialogOpen(true)}
                  title="Змінити пароль"
                >
                  <Key className="h-3.5 w-3.5 mr-1 text-primary" />
                  Пароль
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs px-2 justify-center border-border hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30"
                  onClick={logout}
                  title="Вийти з акаунту"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Вийти
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                type="button"
                onClick={() => setPasswordDialogOpen(true)}
                title="Змінити пароль"
                className="hover:scale-105 transition-transform"
              >
                <Avatar className="h-8 w-8 border border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                    {getInitials(user?.fullName, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
              <button
                type="button"
                onClick={logout}
                title="Вийти з акаунту"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer / Overlay Sheet */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeMobileSidebar}
          />
          {/* Slide-out Panel */}
          <div className="relative flex flex-col justify-between w-72 max-w-[85vw] h-full bg-card border-r border-border p-4 shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                    <Layers className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-foreground text-base">SmartFeed Admin</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={closeMobileSidebar}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {renderNavItems()}
            </div>

            {/* Mobile Footer */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-9 w-9 border border-primary/30">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {getInitials(user?.fullName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user?.fullName || 'Адміністратор'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {user?.email || 'admin@gmail.com'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    closeMobileSidebar();
                    setPasswordDialogOpen(true);
                  }}
                >
                  <Key className="h-3.5 w-3.5 mr-1" />
                  Пароль
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs hover:text-destructive"
                  onClick={logout}
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Вийти
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </>
  );
}
