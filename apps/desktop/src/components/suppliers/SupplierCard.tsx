import {
  Globe,
  Mail,
  Phone,
  ShoppingBag,
  Radio,
  Percent,
  Pencil,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SupplierDto } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface SupplierCardProps {
  supplier: SupplierDto;
  isFeedLimitReached?: boolean;
  onEdit?: (supplier: SupplierDto) => void;
  onDelete?: (supplierId: string) => void;
  onImportFeed?: (supplier: SupplierDto) => void;
  onViewFeeds?: (supplier: SupplierDto) => void;
  onPricingRules?: (supplier: SupplierDto) => void;
}

export function SupplierCard({
  supplier,
  isFeedLimitReached = false,
  onEdit,
  onDelete,
  onImportFeed,
  onViewFeeds,
  onPricingRules,
}: SupplierCardProps) {
  const { t } = useTranslation(['suppliers', 'common']);

  const hasMarkup =
    (supplier.defaultMarginPercent || 0) > 0 || (supplier.defaultFixedMarkup || 0) > 0;

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-md hover:border-primary/40 transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold text-foreground truncate max-w-[160px]">
                {supplier.name}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-mono tracking-wider bg-secondary/50 shrink-0"
              >
                {supplier.code}
              </Badge>
            </div>
            {supplier.notes && (
              <p className="text-xs text-muted-foreground line-clamp-1">{supplier.notes}</p>
            )}
          </div>

          <Badge
            variant={supplier.isActive ? 'secondary' : 'outline'}
            className={`text-[10px] shrink-0 font-medium px-2 py-0.5 ${
              supplier.isActive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-muted-foreground'
            }`}
          >
            {supplier.isActive ? t('suppliers:statusActive') : t('suppliers:statusInactive')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Pricing Markup Pill */}
        <button
          type="button"
          onClick={() => onPricingRules && onPricingRules(supplier)}
          className="w-full p-2.5 rounded-lg bg-secondary/30 border border-border/50 flex items-center justify-between text-xs hover:border-primary/40 hover:bg-secondary/60 transition-colors text-left group cursor-pointer"
          title={t('suppliers:pricingRulesTooltip', {
            defaultValue: 'Налаштувати правила націнки за категоріями та діапазонами цін',
          })}
          data-testid={`supplier-pricing-rules-btn-${supplier.id}`}
        >
          <span className="text-muted-foreground flex items-center gap-1.5 font-medium group-hover:text-primary transition-colors">
            <Percent className="size-3.5 text-primary shrink-0" />
            {t('suppliers:markup')}:
          </span>
          <div className="flex items-center gap-1.5 truncate ml-2">
            <span className="font-semibold text-foreground font-mono truncate">
              {hasMarkup ? (
                <>
                  {supplier.defaultMarginPercent > 0 && `+${supplier.defaultMarginPercent}% `}
                  {supplier.defaultFixedMarkup > 0 && `+${supplier.defaultFixedMarkup} ₴`}
                </>
              ) : (
                <span className="text-muted-foreground font-normal">
                  0% ({t('suppliers:noMarkup', { defaultValue: 'Без націнки' })})
                </span>
              )}
            </span>
            <SlidersHorizontal className="size-3 text-muted-foreground group-hover:text-primary shrink-0" />
          </div>
        </button>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-md bg-background/40 border border-border/40 min-w-0">
            <ShoppingBag className="size-3.5 text-primary shrink-0" />
            <div className="truncate min-w-0">
              <div className="text-[10px] text-muted-foreground leading-none truncate">
                {t('suppliers:totalProducts')}
              </div>
              <div className="font-semibold text-foreground mt-0.5 font-mono truncate">
                {supplier.productsCount ?? 0}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewFeeds && onViewFeeds(supplier)}
            className="flex items-center gap-2 p-2 rounded-md bg-background/40 border border-border/40 min-w-0 text-left hover:bg-secondary/60 hover:border-primary/40 transition-colors cursor-pointer group"
            title={t('suppliers:viewConnectedFeedsTooltip', {
              defaultValue: 'Переглянути підключені фіди',
            })}
            data-testid={`view-supplier-feeds-btn-${supplier.id}`}
          >
            <Radio className="size-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="truncate min-w-0">
              <div className="text-[10px] text-muted-foreground leading-none truncate group-hover:text-primary transition-colors">
                {t('suppliers:activeFeeds')}
              </div>
              <div className="font-semibold text-foreground mt-0.5 font-mono truncate">
                {supplier.activeFeedsCount ?? 0}
              </div>
            </div>
          </button>
        </div>

        {/* Contact Links */}
        <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          {supplier.contactEmail && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{supplier.contactEmail}</span>
            </div>
          )}
          {supplier.contactPhone && (
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="size-3 shrink-0" />
              <span className="truncate">{supplier.contactPhone}</span>
            </div>
          )}
          {supplier.website && (
            <div className="flex items-center gap-1.5 truncate">
              <Globe className="size-3 shrink-0" />
              <a
                href={supplier.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline truncate"
              >
                {supplier.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Action Footer Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          {onImportFeed && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-8 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:text-primary font-medium flex items-center justify-center gap-1.5 truncate disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onImportFeed(supplier)}
              disabled={isFeedLimitReached}
              title={
                isFeedLimitReached
                  ? t('suppliers:feedLimitReachedTooltip', {
                      defaultValue:
                        'Ліміт джерел фідів вичерпано. Підвищіть тариф або видаліть зайві фіди.',
                    })
                  : undefined
              }
              data-testid={`supplier-card-import-btn-${supplier.id}`}
            >
              <Radio className="size-3.5 shrink-0" />
              <span className="truncate">
                {t('suppliers:importFeedBtn', { defaultValue: 'Підключити фід' })}
              </span>
            </Button>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {onPricingRules && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                onClick={() => onPricingRules(supplier)}
                title={t('suppliers:pricingRulesButtonTooltip', {
                  defaultValue: 'Правила націнки',
                })}
                data-testid={`supplier-pricing-rules-icon-${supplier.id}`}
              >
                <SlidersHorizontal className="size-3.5" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60"
                onClick={() => onEdit(supplier)}
                title={t('common:edit', { defaultValue: 'Редагувати' })}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={() => onDelete(supplier.id)}
                title={t('common:delete', { defaultValue: 'Видалити' })}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
