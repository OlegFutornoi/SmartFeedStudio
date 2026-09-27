import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  Store,
  CreditCard,
  Settings,
  Plus,
  ArrowRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

interface CommandSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImportWizard?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'nav' | 'action';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export const CommandSearchDialog: React.FC<CommandSearchDialogProps> = ({
  isOpen,
  onClose,
  onOpenImportWizard,
}) => {
  const { t } = useTranslation(['common', 'catalogs', 'suppliers']);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = [
      {
        id: 'nav-catalogs',
        title: t('common:navCatalogs'),
        category: 'nav',
        icon: Package,
        action: () => {
          navigate('/catalogs');
          onClose();
        },
      },
      {
        id: 'nav-suppliers',
        title: t('common:navSuppliers'),
        category: 'nav',
        icon: Store,
        action: () => {
          navigate('/suppliers');
          onClose();
        },
      },
      {
        id: 'nav-plans',
        title: t('common:navPlans'),
        category: 'nav',
        icon: CreditCard,
        action: () => {
          navigate('/plans');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        title: t('common:navSettings'),
        category: 'nav',
        icon: Settings,
        action: () => {
          navigate('/settings');
          onClose();
        },
      },
    ];

    const actionItems: CommandItem[] = [
      {
        id: 'action-import-feed',
        title: t('catalogs:zeroProductsImportBtn'),
        category: 'action',
        icon: FileSpreadsheet,
        action: () => {
          navigate('/catalogs');
          onClose();
          if (onOpenImportWizard) {
            setTimeout(onOpenImportWizard, 100);
          }
        },
      },
      {
        id: 'action-add-supplier',
        title: t('suppliers:createSupplier'),
        category: 'action',
        icon: Plus,
        action: () => {
          navigate('/suppliers');
          onClose();
        },
      },
    ];

    return [...navItems, ...actionItems];
  }, [t, navigate, onClose, onOpenImportWizard]);

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
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-testid="command-search-dialog"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-card">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common:commandSearchPlaceholder')}
            className="w-full bg-transparent py-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common:close')}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t('common:commandSearchNoResults')} "{query}"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
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
            <span>↑↓ Навігація</span>
            <span>↵ Вибір</span>
            <span>Esc Закрити</span>
          </div>
          <span className="font-mono text-[10px]">SmartFeed ⌘K</span>
        </div>
      </div>
    </div>,
    document.body,
  );
};
