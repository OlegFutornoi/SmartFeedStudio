import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Sparkles, ImageOff, Plus, Minus } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { SimulatorProduct } from '@/modules/feed-simulator/types';

interface ReverseMarginProductCardProps {
  product: SimulatorProduct;
  retailPrice: number;
  onChangeRetailPrice: (price: number) => void;
}

export function ReverseMarginProductCard({
  product,
  retailPrice,
  onChangeRetailPrice,
}: ReverseMarginProductCardProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const [imageError, setImageError] = useState(false);

  const minPreset = Math.round(
    (product.costPrice / (1 - product.marketplaceCommissionPercent / 100)) * 1.05,
  );
  const recPreset = product.defaultRetailPrice;
  const highPreset = Math.round(
    (product.costPrice / (1 - product.marketplaceCommissionPercent / 100)) * 1.45,
  );

  return (
    <div className="space-y-3" data-testid="reverse-margin-product-card">
      {/* Product Header & Info */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/50">
        <div className="relative size-12 rounded-md bg-white border border-border/60 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
          {!imageError && product.imageUrl ? (
            <img
              key={product.imageUrl}
              src={product.imageUrl}
              alt={product.title}
              onError={() => setImageError(true)}
              className="size-full object-contain"
              data-testid="cinema-product-image"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-muted/20 text-muted-foreground/60">
              <ImageOff className="size-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-3xs font-medium bg-background/60 border-border"
            >
              {t('suppliers:cinemaCommissionBadge', {
                marketplace: product.marketplaceName,
                percent: product.marketplaceCommissionPercent,
                defaultValue: `${product.marketplaceName} • ${product.marketplaceCommissionPercent}% комісія`,
              })}
            </Badge>
            {product.isFromFeed && (
              <Badge
                variant="outline"
                className="text-3xs bg-primary/10 text-primary border-primary/20"
              >
                <Sparkles className="size-2.5 mr-0.5" />
                {t('suppliers:cinemaSampleFromFeed', { defaultValue: 'З вашого прайсу' })}
              </Badge>
            )}
            <span className="font-mono text-3xs text-muted-foreground ml-auto">{product.sku}</span>
          </div>

          <h5 className="text-xs font-semibold text-foreground truncate" title={product.title}>
            {product.title}
          </h5>
        </div>
      </div>

      {/* Interactive Retail Price Controller */}
      <div className="p-3 rounded-lg bg-secondary/20 border border-border/40 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label
            htmlFor="retail-price-input"
            className="text-2xs font-medium text-foreground flex items-center gap-1"
          >
            <Tag className="size-3 text-primary" />
            {t('suppliers:cinemaDesiredRetailPrice', {
              defaultValue: 'Бажана вартість продажу на вітрині',
            })}
            :
          </label>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onChangeRetailPrice(Math.max(product.costPrice, retailPrice - 50))}
              data-testid="retail-price-minus-50-btn"
            >
              <Minus className="size-3" />
            </Button>
            <div className="flex items-center gap-1 w-24">
              <Input
                id="retail-price-input"
                type="number"
                min={1}
                step={10}
                value={retailPrice}
                onChange={(e) => onChangeRetailPrice(Number(e.target.value) || 0)}
                className="h-7 text-xs font-mono font-bold text-right pr-1 bg-background"
                data-testid="retail-price-input"
              />
              <span className="text-xs font-mono text-muted-foreground">₴</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onChangeRetailPrice(retailPrice + 50)}
              data-testid="retail-price-plus-50-btn"
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>

        {/* Quick Price Preset Chips using shadcn Button */}
        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
          <span className="text-3xs text-muted-foreground mr-1">
            {t('suppliers:cinemaQuickPresets', { defaultValue: 'Швидкі пресети:' })}
          </span>
          <Button
            type="button"
            size="sm"
            variant={retailPrice === minPreset ? 'default' : 'outline'}
            onClick={() => onChangeRetailPrice(minPreset)}
            className="h-6 px-2 text-3xs font-medium rounded"
            data-testid="preset-min-btn"
          >
            {t('suppliers:cinemaPresetMin', { defaultValue: 'Мінімальна' })} ({minPreset} ₴)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={retailPrice === recPreset ? 'default' : 'outline'}
            onClick={() => onChangeRetailPrice(recPreset)}
            className="h-6 px-2 text-3xs font-medium rounded"
            data-testid="preset-rec-btn"
          >
            {t('suppliers:cinemaPresetRecommended', { defaultValue: 'Рекомендована' })} ({recPreset}{' '}
            ₴)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={retailPrice === highPreset ? 'default' : 'outline'}
            onClick={() => onChangeRetailPrice(highPreset)}
            className="h-6 px-2 text-3xs font-medium rounded"
            data-testid="preset-high-btn"
          >
            {t('suppliers:cinemaPresetPremium', { defaultValue: 'Висока маржа' })} ({highPreset} ₴)
          </Button>
        </div>
      </div>
    </div>
  );
}
