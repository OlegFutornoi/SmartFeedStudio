'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { Button } from '../ui/button';
import { MoreHorizontal, PauseCircle, PlayCircle, Trash2, Loader2 } from 'lucide-react';

interface LicenseRowActionsProps {
  license: AdminLicenseItemDto;
  isUk: boolean;
  onStatusChange: (id: string, newActive: boolean) => Promise<void>;
  onOpenDelete: (license: AdminLicenseItemDto) => void;
}

export function LicenseRowActions({
  license,
  isUk,
  onStatusChange,
  onOpenDelete,
}: LicenseRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click, window scroll or Escape key
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
      await onStatusChange(license.id, !license.isActive);
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
        data-testid={`license-actions-btn-${license.licenseKey}`}
        onClick={toggleMenu}
        className="h-8 w-8 p-0 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        title={isUk ? 'Дії з ліцензією' : 'License Actions'}
        aria-label={isUk ? 'Дії з ліцензією' : 'License Actions'}
      >
        <MoreHorizontal className="size-4" />
      </Button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            data-testid={`license-actions-menu-${license.licenseKey}`}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              right: `${coords.right}px`,
            }}
            className="w-48 rounded-lg border border-border bg-popover text-popover-foreground p-1.5 shadow-2xl z-[9999] animate-in fade-in-80 zoom-in-95 duration-150 backdrop-blur-none"
          >
            {/* Toggle Suspend / Resume */}
            <button
              type="button"
              data-testid={`license-action-toggle-${license.licenseKey}`}
              onClick={handleToggle}
              disabled={isToggling}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isToggling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : license.isActive ? (
                <PauseCircle className="size-3.5 text-amber-500" />
              ) : (
                <PlayCircle className="size-3.5 text-emerald-500" />
              )}
              <span>
                {license.isActive
                  ? isUk
                    ? 'Призупинити ліцензію'
                    : 'Suspend License'
                  : isUk
                    ? 'Відновити ліцензію'
                    : 'Resume License'}
              </span>
            </button>

            <div className="my-1 border-t border-border" />

            {/* Delete License */}
            <button
              type="button"
              data-testid={`license-action-delete-${license.licenseKey}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenDelete(license);
              }}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>{isUk ? 'Видалити ліцензію' : 'Delete License'}</span>
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
