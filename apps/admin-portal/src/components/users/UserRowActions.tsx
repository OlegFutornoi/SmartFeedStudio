'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { UserListItemDto } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PauseCircle, PlayCircle, Trash2, Users, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserRowActionsProps {
  user: UserListItemDto;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (user: UserListItemDto) => void;
  onOpenTeam?: (user: UserListItemDto) => void;
}

export function UserRowActions({
  user,
  onStatusChange,
  onOpenDelete,
  onOpenTeam,
}: UserRowActionsProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = user.isActive !== false;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      if (isOpen) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    try {
      await onStatusChange(user.id, !isActive);
      setIsOpen(false);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="relative inline-flex items-center justify-end">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        data-testid={`user-actions-btn-${user.id}`}
        onClick={toggleMenu}
        className="h-8 w-8 p-0 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        title={t('users', 'actions_title')}
        aria-label={t('users', 'actions_title')}
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            data-testid={`user-actions-menu-${user.id}`}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              right: `${coords.right}px`,
            }}
            className="w-max min-w-[210px] rounded-lg border border-border bg-popover text-popover-foreground p-1.5 shadow-2xl z-[9999] animate-in fade-in-80 zoom-in-95 duration-150 backdrop-blur-none"
          >
            {/* Manage Team (if owner has organization) */}
            {user.organization?.isOwner && onOpenTeam && (
              <>
                <button
                  type="button"
                  data-testid={`user-action-team-${user.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onOpenTeam(user);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Users className="size-3.5 text-primary shrink-0" />
                  <span className="whitespace-nowrap">{t('users', 'action_manage_team')}</span>
                </button>
                <div className="my-1 border-t border-border" />
              </>
            )}

            {/* Toggle Suspend / Resume */}
            <button
              type="button"
              data-testid={`user-action-toggle-${user.id}`}
              onClick={handleToggle}
              disabled={isToggling}
              className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {isToggling ? (
                <Loader2 className="size-3.5 animate-spin shrink-0" />
              ) : isActive ? (
                <PauseCircle className="size-3.5 text-muted-foreground shrink-0" />
              ) : (
                <PlayCircle className="size-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {isActive ? t('users', 'action_suspend') : t('users', 'action_resume')}
              </span>
            </button>

            <div className="my-1 border-t border-border" />

            {/* Delete User */}
            <button
              type="button"
              data-testid={`user-action-delete-${user.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenDelete(user);
              }}
              className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span className="whitespace-nowrap">{t('users', 'action_delete')}</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
