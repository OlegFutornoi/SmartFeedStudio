'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  Receipt,
  KeyRound,
  Package,
  CreditCard,
  Compass,
  Settings,
  ArrowRight,
  User,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminCommandSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AdminCommandSearchDialog({ isOpen, onClose }: AdminCommandSearchDialogProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUk = locale === 'uk';

  const items: CommandItem[] = useMemo(() => {
    return [
      {
        id: 'nav-dashboard',
        title: isUk ? 'Дашборд (Головна)' : 'Dashboard (Home)',
        path: '/',
        icon: LayoutDashboard,
      },
      {
        id: 'nav-users',
        title: isUk ? 'Користувачі та організації' : 'Users & Organizations',
        path: '/users',
        icon: Users,
      },
      {
        id: 'nav-transactions',
        title: isUk ? 'Транзакції та платежі' : 'Transactions & Payments',
        path: '/transactions',
        icon: Receipt,
      },
      {
        id: 'nav-licenses',
        title: isUk ? 'Ліцензійні ключі' : 'License Keys',
        path: '/licenses',
        icon: KeyRound,
      },
      {
        id: 'nav-plans',
        title: isUk ? 'Тарифні плани' : 'Tariff Plans',
        path: '/plans',
        icon: Package,
      },
      {
        id: 'nav-payments',
        title: isUk ? 'Платіжні шлюзи' : 'Payment Gateways',
        path: '/payments',
        icon: CreditCard,
      },
      {
        id: 'nav-navigation',
        title: isUk ? 'Управління навігацією' : 'Navigation Items',
        path: '/navigation',
        icon: Compass,
      },
      {
        id: 'nav-profile',
        title: isUk ? 'Профіль адміністратора' : 'Administrator Profile',
        path: '/profile',
        icon: User,
      },
      {
        id: 'nav-settings',
        title: isUk ? 'Налаштування платформи' : 'Platform Settings',
        path: '/settings',
        icon: Settings,
      },
    ];
  }, [isUk]);

  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return items;
    return items.filter((item) => item.title.toLowerCase().includes(cleanQuery));
  }, [items, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        router.push(filteredItems[selectedIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-testid="admin-command-dialog"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar (matching user's design) */}
        <div className="flex items-center px-3.5 py-2.5 border-b border-border/60 bg-card">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2.5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isUk ? 'Пошук...' : 'Search....'}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd
            onClick={onClose}
            className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/80 border border-border/80 rounded cursor-pointer hover:bg-muted ml-2 shrink-0 select-none"
            title="Escape"
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {isUk ? 'Нічого не знайдено' : 'No sections found'} "{query}"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <ArrowRight
                    className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Help Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>↑↓ {isUk ? 'Навігація' : 'Navigate'}</span>
            <span>↵ {isUk ? 'Перехід' : 'Select'}</span>
            <span>Esc {isUk ? 'Закрити' : 'Close'}</span>
          </div>
          <span className="font-mono text-[10px]">Admin ⌘K</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
