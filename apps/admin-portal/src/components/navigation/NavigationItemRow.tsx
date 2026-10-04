'use client';

import React from 'react';
import { Edit2, Trash2, Eye, EyeOff, MoveUp, MoveDown, Crown, Monitor, Shield } from 'lucide-react';
import { NavigationItemDto, TargetApp } from '@smartfeed/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getIconComponent } from '@/components/navigation/constants';
import { cn } from '@/lib/utils';

interface NavigationItemRowProps {
  item: NavigationItemDto;
  index: number;
  totalCount: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleActive: (item: NavigationItemDto) => void;
  onEdit: (item: NavigationItemDto) => void;
  onDelete: (item: NavigationItemDto) => void;
}

export const NavigationItemRow = React.memo(function NavigationItemRow({
  item,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  onEdit,
  onDelete,
}: NavigationItemRowProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-muted/40 transition-all duration-200 gap-3',
        !item.isVisible && 'opacity-55 bg-muted/20 border-dashed',
      )}
    >
      {/* Reorder and Identity */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            data-testid={`move-up-${item.key}`}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-20"
            title="Move up"
          >
            <MoveUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={index === totalCount - 1}
            onClick={() => onMoveDown(index)}
            data-testid={`move-down-${item.key}`}
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground disabled:opacity-20"
            title="Move down"
          >
            <MoveDown className="h-3 w-3" />
          </Button>
        </div>

        {/* Icon preview */}
        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          {getIconComponent(item.icon)}
        </div>

        {/* Labels & Path */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">{item.labelUk}</span>
            <span className="text-xs text-muted-foreground">/ {item.labelEn}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
            <span>{item.path}</span>
            <span>•</span>
            <span className="text-[11px] text-muted-foreground/70">key: {item.key}</span>
          </div>
        </div>
      </div>

      {/* Badges & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Target App Badge */}
        <Badge
          variant="outline"
          className="text-[10px] uppercase font-mono px-2 py-0.5 gap-1 border-primary/20 text-primary bg-primary/5"
        >
          {item.targetApp === TargetApp.DESKTOP ? (
            <Monitor className="h-2.5 w-2.5" />
          ) : (
            <Shield className="h-2.5 w-2.5" />
          )}
          {item.targetApp}
        </Badge>

        {/* Plan Tier Badge */}
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] font-mono px-2 py-0.5 gap-1',
            !item.requiredPlan
              ? 'border-border text-muted-foreground bg-muted/30'
              : 'border-primary/30 text-primary bg-primary/10',
          )}
        >
          {item.requiredPlan && <Crown className="h-2.5 w-2.5" />}
          {item.requiredPlan ? `${item.requiredPlan}+` : 'ALL'}
        </Badge>

        {/* Visibility Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(item)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title={item.isVisible ? 'Hide item' : 'Show item'}
        >
          {item.isVisible ? (
            <Eye className="h-4 w-4 text-primary" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Edit item"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
});
