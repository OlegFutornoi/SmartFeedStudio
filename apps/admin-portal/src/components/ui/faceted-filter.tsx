'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LucideIcon } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

export interface FacetedOption {
  value: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface FacetedFilterProps {
  title: string;
  options: FacetedOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  icon?: LucideIcon;
  dataTestId?: string;
}

export const FacetedFilter = React.memo(function FacetedFilter({
  title,
  options,
  selectedValue,
  onSelect,
  icon: Icon,
  dataTestId,
}: FacetedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentOption = options.find((opt) => opt.value === selectedValue) || options[0];
  const isFiltered = selectedValue !== 'ALL';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid={dataTestId}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 border-dashed text-xs gap-1.5 px-2.5 font-normal ${
          isFiltered
            ? 'border-primary/50 bg-primary/5 text-foreground font-medium'
            : 'border-border text-muted-foreground hover:text-foreground'
        }`}
      >
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <span>{title}</span>
        {isFiltered && currentOption && (
          <>
            <span className="text-muted-foreground/60">|</span>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 font-mono font-normal rounded-sm"
            >
              {currentOption.label}
            </Badge>
          </>
        )}
        <ChevronDown className="size-3 opacity-50 ml-0.5" />
      </Button>

      {isOpen && (
        <div
          data-testid={`${dataTestId}-popover`}
          className="absolute left-0 top-full mt-1.5 w-52 rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl z-50 p-1.5 animate-in fade-in-0 zoom-in-95 backdrop-blur-none"
        >
          <div className="space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === selectedValue;
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  data-testid={`${dataTestId}-option-${option.value.toLowerCase()}`}
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-muted/80 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`size-3.5 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 bg-background/50'
                      }`}
                    >
                      {isSelected && <Check className="size-2.5 stroke-[3]" />}
                    </div>
                    {OptionIcon && <OptionIcon className="size-3 text-muted-foreground shrink-0" />}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {typeof option.count === 'number' && (
                    <span className="text-[10px] font-mono text-muted-foreground ml-2 px-1.5 py-0.5 rounded bg-muted/40 border border-border/40">
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
