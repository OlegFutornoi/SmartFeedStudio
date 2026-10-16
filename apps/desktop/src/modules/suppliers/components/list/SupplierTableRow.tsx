import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, ExternalLink, Edit2, Trash2, PlusCircle, Mail, Phone } from 'lucide-react';
import { SupplierDto, getCurrencySymbol } from '@smartfeed/shared';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/i18n';
import type { SupplierColumnId } from '@/modules/suppliers/types';
import { SupplierAvatar } from '@/modules/suppliers/components/common/SupplierAvatar';

export interface SupplierTableRowProps {
  supplier: SupplierDto;
  onOpenDetails: (supplier: SupplierDto) => void;
  onOpenFeeds?: (supplier: SupplierDto) => void;
  onEdit: (supplier: SupplierDto) => void;
  onDelete: (supplierId: string) => void;
  onAddFeed: (supplier: SupplierDto) => void;
  onToggleStatus?: (supplier: SupplierDto) => void;
  isColumnVisible?: (id: SupplierColumnId) => boolean;
}

export const SupplierTableRow: React.FC<SupplierTableRowProps> = ({
  supplier: s,
  onOpenDetails,
  onOpenFeeds,
  onEdit,
  onDelete,
  onAddFeed,
  onToggleStatus,
  isColumnVisible,
}) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const visible = (id: SupplierColumnId) => (isColumnVisible ? isColumnVisible(id) : true);

  const currencySym = getCurrencySymbol(s.baseCurrency || 'UAH');

  return (
    <TableRow
      key={s.id}
      className="h-12 hover:bg-muted/40 transition-colors border-b border-border/60"
      data-testid={`supplier-row-${s.id}`}
    >
      {/* Vendor Name & Code */}
      <TableCell className="pl-3.5 py-2">
        <div className="flex items-center gap-2.5">
          <div onClick={() => onOpenDetails(s)} className="cursor-pointer">
            <SupplierAvatar
              logoUrl={s.logoUrl}
              name={s.name}
              size="sm"
              className="hover:border-primary/50 transition-colors"
              dataTestId={`supplier-row-avatar-${s.id}`}
            />
          </div>
          <div className="min-w-0">
            <Button
              variant="link"
              onClick={() => onOpenDetails(s)}
              className="p-0 h-auto font-medium text-foreground hover:text-primary hover:no-underline transition-colors text-left truncate block max-w-[190px]"
              data-testid={`supplier-name-${s.id}`}
            >
              {s.name}
            </Button>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xs font-mono text-muted-foreground uppercase bg-muted px-1.5 py-0.2 rounded">
                {s.code}
              </span>
            </div>
          </div>
        </div>
      </TableCell>

      {/* Contacts */}
      {visible('contacts') && (
        <TableCell className="py-2">
          {(() => {
            const hasPhone = Boolean(s.contactPhone && /\d/.test(s.contactPhone));
            const hasEmail = Boolean(s.contactEmail && s.contactEmail.includes('@'));

            if (!hasEmail && !hasPhone) {
              return (
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  <span className="text-muted-foreground/60 italic">—</span>
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {hasEmail && (
                  <div className="flex items-center gap-1 truncate max-w-[190px]">
                    <Mail className="size-3 shrink-0" />
                    <span className="truncate">{s.contactEmail}</span>
                  </div>
                )}
                {hasPhone && (
                  <div className="flex items-center gap-1 truncate">
                    <Phone className="size-3 shrink-0" />
                    <span>{s.contactPhone}</span>
                  </div>
                )}
              </div>
            );
          })()}
        </TableCell>
      )}

      {/* Feeds Count */}
      {visible('feeds') && (
        <TableCell className="py-2 text-center">
          <Badge
            variant="outline"
            className="text-xs font-mono font-medium h-5.5 px-2 cursor-pointer hover:bg-muted"
            onClick={() => (onOpenFeeds ? onOpenFeeds(s) : onOpenDetails(s))}
            data-testid={`view-supplier-feeds-btn-${s.id}`}
          >
            {s.activeFeedsCount || 0}
          </Badge>
        </TableCell>
      )}

      {/* Products Count */}
      {visible('products') && (
        <TableCell className="py-2 text-center font-mono font-medium">
          {(s.productsCount || 0).toLocaleString()}
        </TableCell>
      )}

      {/* Currency & Default Markup */}
      {visible('currencyMarkup') && (
        <TableCell className="py-2 text-center">
          <div className="flex flex-col items-center gap-0.5">
            <Badge variant="secondary" className="text-2xs h-4.5 px-1.5 font-bold font-mono">
              {s.baseCurrency || 'UAH'} ({currencySym})
            </Badge>
            <span className="text-xs text-muted-foreground">
              +{s.defaultMarginPercent || 0}%
              {s.defaultFixedMarkup ? ` +${s.defaultFixedMarkup} ₴` : ''}
            </span>
          </div>
        </TableCell>
      )}

      {/* Active Switch Column (Strictly Switch) */}
      {visible('isActiveToggle') && (
        <TableCell
          className="w-[80px] py-2 text-center"
          data-testid={`supplier-active-toggle-${s.id}`}
        >
          <div className="flex items-center justify-center">
            <Switch
              checked={s.isActive}
              onCheckedChange={() => onToggleStatus?.(s)}
              className="scale-75 cursor-pointer"
              data-testid={`supplier-switch-${s.id}`}
              aria-label={t('suppliers:columnIsActiveToggle', {
                defaultValue: 'Активність',
              })}
            />
          </div>
        </TableCell>
      )}

      {/* Status Badge Column (Strictly Status Badge) */}
      {visible('status') && (
        <TableCell
          className="w-[110px] py-2 text-center"
          data-testid={`supplier-status-badge-${s.id}`}
        >
          <div className="flex items-center justify-center">
            {s.isActive ? (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-success/15 text-success border border-success/30"
                data-testid="status-badge"
              >
                {t('suppliers:statusActive', { defaultValue: 'Активний' })}
              </span>
            ) : (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-muted text-muted-foreground border border-border"
                data-testid="status-badge"
              >
                {t('suppliers:statusInactive', { defaultValue: 'Неактивний' })}
              </span>
            )}
          </div>
        </TableCell>
      )}

      {/* Row Actions Menu */}
      <TableCell className="pr-3.5 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddFeed(s)}
            className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
            title={t('suppliers:actionAddFeed', { defaultValue: 'Підключити фід' })}
            data-testid={`supplier-card-import-btn-${s.id}`}
          >
            <PlusCircle className="size-3.5" />
          </Button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                data-testid={`supplier-actions-${s.id}`}
              >
                <MoreVertical className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs w-44">
              <DropdownMenuItem
                onClick={() => onOpenDetails(s)}
                className="gap-2 cursor-pointer"
                data-testid={`action-details-${s.id}`}
              >
                <ExternalLink className="size-3.5" />
                {t('suppliers:actionWorkspace', { defaultValue: 'Кабінет постачальника' })}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddFeed(s)}
                className="gap-2 cursor-pointer"
                data-testid={`action-add-feed-${s.id}`}
              >
                <PlusCircle className="size-3.5" />
                {t('suppliers:actionAddFeed', { defaultValue: 'Підключити фід' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(s)} className="gap-2 cursor-pointer">
                <Edit2 className="size-3.5" />
                {t('common:edit', { defaultValue: 'Редагувати' })}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(s.id)}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                data-testid={`action-delete-${s.id}`}
              >
                <Trash2 className="size-3.5" />
                {t('common:delete', { defaultValue: 'Видалити' })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
