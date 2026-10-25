import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, ExternalLink, Edit2, Trash2, PlusCircle, Mail, Phone } from 'lucide-react';
import { SupplierDto } from '@smartfeed/shared';
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

  return (
    <TableRow
      key={s.id}
      className="group h-12 hover:bg-muted/40 transition-colors border-b border-border/60"
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
              {s.managerName ? (
                <span
                  className="text-xs text-muted-foreground truncate max-w-[190px]"
                  title={s.managerName}
                  data-testid={`supplier-manager-${s.id}`}
                >
                  {s.managerName}
                </span>
              ) : (
                <span
                  className="text-xs text-muted-foreground/50 italic truncate max-w-[190px]"
                  title={t('suppliers:managerPlaceholder', { defaultValue: 'Прізвище та ім’я' })}
                  data-testid={`supplier-no-manager-${s.id}`}
                >
                  {t('suppliers:managerPlaceholder', { defaultValue: 'Прізвище та ім’я' })}
                </span>
              )}
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

      {/* Industry Column */}
      {visible('industry') && (
        <TableCell className="py-2 text-xs" data-testid={`supplier-industry-${s.id}`}>
          <span
            className={`truncate max-w-[160px] block ${s.industry ? 'text-foreground' : 'text-muted-foreground/50 italic'}`}
            title={s.industry || t('suppliers:noIndustry', { defaultValue: 'Галузь не вказана' })}
          >
            {s.industry || t('suppliers:noIndustry', { defaultValue: 'Галузь не вказана' })}
          </span>
        </TableCell>
      )}

      {/* Segment Column */}
      {visible('segment') && (
        <TableCell className="py-2 text-xs" data-testid={`supplier-segment-${s.id}`}>
          <span
            className={`truncate max-w-[120px] block ${s.segment ? 'text-foreground' : 'text-muted-foreground/50 italic'}`}
            title={s.segment || t('suppliers:noSegment', { defaultValue: 'Сегмент не вказано' })}
          >
            {s.segment || t('suppliers:noSegment', { defaultValue: 'Сегмент не вказано' })}
          </span>
        </TableCell>
      )}

      {/* Feeds Count */}
      {visible('feeds') && (
        <TableCell className="py-2 text-center text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs font-normal text-foreground hover:text-primary hover:bg-transparent"
            onClick={() => (onOpenFeeds ? onOpenFeeds(s) : onOpenDetails(s))}
            data-testid={`view-supplier-feeds-btn-${s.id}`}
          >
            {s.activeFeedsCount || 0}
          </Button>
        </TableCell>
      )}

      {/* Products Count */}
      {visible('products') && (
        <TableCell className="py-2 text-center text-xs font-normal text-foreground">
          {(s.productsCount || 0).toLocaleString()}
        </TableCell>
      )}

      {/* Markup */}
      {visible('currencyMarkup') && (
        <TableCell
          className="py-2 text-center text-xs font-normal text-foreground"
          data-testid={`supplier-currency-${s.id}`}
        >
          <span className="font-medium text-primary">+{s.defaultMarginPercent || 0}%</span>
        </TableCell>
      )}

      {/* Status Badge Column */}
      {visible('status') && (
        <TableCell
          className="w-[110px] min-w-[110px] py-2 text-center"
          data-testid={`supplier-status-badge-${s.id}`}
        >
          <div className="flex items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus?.(s)}
              className="h-auto p-0 hover:bg-transparent cursor-pointer transition-opacity hover:opacity-80"
              title={s.isActive ? t('suppliers:statusActive') : t('suppliers:statusInactive')}
              data-testid={`supplier-status-toggle-${s.id}`}
            >
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs w-[105px] justify-center border ${
                  s.isActive
                    ? 'font-semibold bg-success/15 text-success border-success/30 shadow-2xs'
                    : 'font-medium bg-muted text-muted-foreground border-border'
                }`}
                data-testid="status-badge"
              >
                <span
                  className={`size-1.5 rounded-full shrink-0 ${
                    s.isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'
                  }`}
                />
                {s.isActive
                  ? t('suppliers:statusActive', { defaultValue: 'Активний' })
                  : t('suppliers:statusInactive', { defaultValue: 'Неактивний' })}
              </span>
            </Button>
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
            className="size-7 text-muted-foreground hover:text-foreground opacity-70 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            title={t('suppliers:actionAddFeed', { defaultValue: 'Підключити фід' })}
            aria-label={t('suppliers:actionAddFeed', { defaultValue: 'Підключити фід' })}
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
