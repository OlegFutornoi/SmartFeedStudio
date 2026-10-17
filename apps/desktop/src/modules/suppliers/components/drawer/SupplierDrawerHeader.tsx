// @golden - Reference pattern for 100% solid non-translucent sticky drawer header (UI-01, UI-05)
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ExternalLink, Maximize2, Minimize2, X } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { SupplierDto } from '@smartfeed/shared';
import { SupplierAvatar } from '@/modules/suppliers/components/common/SupplierAvatar';

interface SupplierDrawerHeaderProps {
  supplier: SupplierDto;
  onToggleStatus: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClose?: () => void;
}

export const SupplierDrawerHeader: React.FC<SupplierDrawerHeaderProps> = ({
  supplier,
  onToggleStatus,
  isExpanded = false,
  onToggleExpand,
  onClose,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div
      className="p-4 px-5 border-b border-border/80 bg-card"
      data-testid="supplier-drawer-header"
    >
      {/* Top Vendor Info & Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SupplierAvatar
            logoUrl={supplier.logoUrl}
            name={supplier.name}
            size="lg"
            dataTestId="supplier-drawer-avatar"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2
                className="text-base font-bold tracking-tight text-foreground truncate"
                data-testid="supplier-drawer-name"
              >
                {supplier.name}
              </h2>
              {supplier.code && (
                <Badge
                  variant="outline"
                  className="text-2xs py-0 px-1.5 font-mono"
                  data-testid="supplier-drawer-code"
                >
                  {supplier.code}
                </Badge>
              )}
              {/* Status Switch (moved to the left next to supplier info) */}
              <div className="flex items-center gap-1.5 ml-1">
                <span
                  className={`text-xs font-medium ${
                    supplier.isActive ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {supplier.isActive
                    ? t('suppliers:statusActive', { defaultValue: 'Активний' })
                    : t('suppliers:statusInactive', { defaultValue: 'Неактивний' })}
                </span>
                <Switch
                  checked={supplier.isActive}
                  onCheckedChange={onToggleStatus}
                  className="cursor-pointer scale-90"
                  data-testid="supplier-drawer-active-toggle"
                  aria-label={t('suppliers:columnStatus', { defaultValue: 'Статус' })}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
              {supplier.contactEmail && <span>{supplier.contactEmail}</span>}
              {supplier.website && (
                <a
                  href={
                    supplier.website.startsWith('http')
                      ? supplier.website
                      : `https://${supplier.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors inline-flex items-center"
                  title={supplier.website}
                  data-testid="supplier-drawer-website-icon"
                >
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Action Icons: Expand/Collapse & Close */}
        <div className="flex items-center gap-1 shrink-0">
          {onToggleExpand && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              onClick={onToggleExpand}
              data-testid="supplier-drawer-fullscreen-btn"
              title={
                isExpanded
                  ? t('suppliers:collapseDrawer', { defaultValue: 'Згорнути' })
                  : t('suppliers:openFullWorkspace', { defaultValue: 'На весь екран' })
              }
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              <span className="sr-only">
                {isExpanded
                  ? t('suppliers:collapseDrawer', { defaultValue: 'Згорнути' })
                  : t('suppliers:openFullWorkspace', { defaultValue: 'На весь екран' })}
              </span>
            </Button>
          )}

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              onClick={onClose}
              data-testid="supplier-drawer-header-close-btn"
              title={t('common:close', { defaultValue: 'Закрити' })}
            >
              <X className="size-4" />
              <span className="sr-only">{t('common:close', { defaultValue: 'Закрити' })}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
