import { useState, useEffect, useMemo } from 'react';
import type { SupplierDto } from '@smartfeed/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ImageOff,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { SimulatorProduct } from '@/modules/feed-simulator/types';
import { buildCinemaScenario } from '@/modules/feed-simulator/services/reverse-margin-cinema.service';
import { ReverseMarginCinemaPhases } from '@/modules/feed-simulator/components/ReverseMarginCinemaPhases';
import { ReverseMarginFormulaBar } from '@/modules/feed-simulator/components/ReverseMarginFormulaBar';

interface ReverseMarginCinemaShowcaseProps {
  products: SimulatorProduct[];
  supplier?: SupplierDto;
}

export function ReverseMarginCinemaShowcase({
  products,
  supplier,
}: ReverseMarginCinemaShowcaseProps) {
  const { t } = useTranslation(['suppliers', 'common']);
  const [productIndex, setProductIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(3); // default full reveal, auto-play steps 0..3
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageError, setImageError] = useState(false);

  const safeProducts = useMemo(() => {
    return products.length > 0 ? products : [];
  }, [products]);

  const activeProduct = safeProducts[productIndex % safeProducts.length];
  const scenario = useMemo(() => {
    if (!activeProduct) return null;
    return buildCinemaScenario(activeProduct, supplier);
  }, [activeProduct, supplier]);

  // Reset image error on product switch
  useEffect(() => {
    setImageError(false);
  }, [activeProduct?.id]);

  // Autonomous Cinema Auto-play loop
  useEffect(() => {
    if (!isPlaying || !scenario) return;

    const timer = setInterval(() => {
      setPhaseIndex((prev) => {
        if (prev < 3) {
          return prev + 1;
        }
        // If finished all 4 phases, switch to next product after a pause
        setProductIndex((pi) => (pi + 1) % safeProducts.length);
        return 0;
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [isPlaying, scenario, safeProducts.length]);

  const handleNextProduct = () => {
    setProductIndex((pi) => (pi + 1) % safeProducts.length);
    setPhaseIndex(3);
  };

  const handlePrevProduct = () => {
    setProductIndex((pi) => (pi - 1 + safeProducts.length) % safeProducts.length);
    setPhaseIndex(3);
  };

  if (!scenario) return null;

  return (
    <div
      data-testid="reverse-margin-cinema-showcase"
      className="rounded-lg border border-border/60 bg-card overflow-hidden"
    >
      {/* Cinema Header Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7 rounded-md bg-muted border border-border/60 text-muted-foreground flex items-center justify-center shrink-0">
            <Calculator className="size-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate">
              {t('suppliers:cinemaTitle', {
                defaultValue: 'Автономне моделювання: Як не прогоріти на маркетплейсі',
              })}
            </h4>
            <p className="text-2xs text-muted-foreground truncate">
              {t('suppliers:cinemaSubtitle', {
                defaultValue:
                  'Автоматичний розрахунок зворотного відсотка рятує ваш чистий заробіток',
              })}
            </p>
          </div>
        </div>

        {/* Controls: Counter, Prev, Play/Pause, Next */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span className="text-2xs font-mono tabular-nums text-muted-foreground px-1.5">
            {t('suppliers:cinemaProductCounter', {
              current: (productIndex % safeProducts.length) + 1,
              total: safeProducts.length,
              defaultValue: 'Товар {{current}} з {{total}}',
            })}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handlePrevProduct}
            aria-label={t('suppliers:cinemaPrevProductAria', { defaultValue: 'Попередній товар' })}
          >
            <ChevronLeft className="size-3.5" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-2xs font-medium gap-1 bg-background border-border"
            onClick={() => setIsPlaying(!isPlaying)}
            data-testid="cinema-play-pause-btn"
          >
            {isPlaying ? (
              <>
                <Pause className="size-3 text-muted-foreground" />
                <span>{t('suppliers:cinemaPause', { defaultValue: 'Пауза' })}</span>
              </>
            ) : (
              <>
                <Play className="size-3 text-muted-foreground" />
                <span>{t('suppliers:cinemaPlay', { defaultValue: 'Автоплей' })}</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleNextProduct}
            aria-label={t('suppliers:cinemaNextProductAria', { defaultValue: 'Наступний товар' })}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Active Product Headline */}
        <div className="flex items-center gap-3 p-2.5 rounded-md bg-muted/20 border border-border/60">
          <div className="relative size-10 rounded-md bg-white border border-border/60 overflow-hidden shrink-0 flex items-center justify-center p-1">
            {!imageError && scenario.product.imageUrl ? (
              <img
                key={scenario.product.imageUrl}
                src={scenario.product.imageUrl}
                alt={scenario.product.title}
                onError={() => setImageError(true)}
                className="size-full object-contain"
                data-testid="cinema-product-image"
              />
            ) : (
              <ImageOff className="size-4 text-muted-foreground/60" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className="text-3xs bg-background border-border text-foreground px-1.5 py-0 h-4"
              >
                {scenario.product.categoryName}
              </Badge>
              <Badge
                variant="outline"
                className="text-3xs bg-muted/50 border-border text-muted-foreground font-mono tabular-nums px-1.5 py-0 h-4"
              >
                {t('suppliers:cinemaCommissionBadge', {
                  marketplace: scenario.marketplaceName,
                  percent: scenario.marketplacePercent,
                  defaultValue: '{{marketplace}} • {{percent}}% комісія',
                })}
              </Badge>
              <span className="font-mono tabular-nums text-3xs text-muted-foreground ml-auto">
                {scenario.product.sku}
              </span>
            </div>
            <h5
              className="text-xs font-semibold text-foreground truncate"
              title={scenario.product.title}
            >
              {scenario.product.title}
            </h5>
          </div>
        </div>

        {/* 4 Storytelling Visual Phases Grid */}
        <ReverseMarginCinemaPhases
          scenario={scenario}
          phaseIndex={phaseIndex}
          onSelectPhase={(idx) => {
            setPhaseIndex(idx);
            setIsPlaying(false);
          }}
        />

        {/* Live Formula & Comparative Impact Bar */}
        <ReverseMarginFormulaBar scenario={scenario} />

        {/* Bottom Protection Summary Strip */}
        <div className="px-3 py-2 rounded-md bg-success/10 border border-success/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="size-3.5 text-success shrink-0" />
            <span className="text-2xs text-foreground font-medium truncate">
              {t('suppliers:cinemaProtectionSummary', {
                name: scenario.marketplaceName,
                defaultValue:
                  'SmartFeed захищає продавця: ви отримуєте рівно запланований дохід без втрат на комісіях {{name}}.',
              })}
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-3xs font-mono border-success/30 bg-success/10 text-success px-1.5 py-0 h-4 shrink-0"
          >
            {t('suppliers:cinemaProtectedBadge', { defaultValue: 'Захищено' })}
          </Badge>
        </div>
      </div>
    </div>
  );
}
