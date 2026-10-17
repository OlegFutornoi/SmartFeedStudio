import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
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
}

export function ReverseMarginCinemaShowcase({ products }: ReverseMarginCinemaShowcaseProps) {
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
    return buildCinemaScenario(activeProduct);
  }, [activeProduct]);

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
      className="rounded-2xl border border-primary/25 bg-gradient-to-b from-card via-card/95 to-primary/5 p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Cinema Header Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center animate-pulse">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
              {t('suppliers:cinemaTitle', {
                defaultValue: 'Автономне моделювання: Як не прогоріти на маркетплейсі',
              })}
            </h4>
            <p className="text-2xs text-muted-foreground">
              {t('suppliers:cinemaSubtitle', {
                defaultValue:
                  'Автоматичний розрахунок зворотного відсотка рятує ваш чистий заробіток',
              })}
            </p>
          </div>
        </div>

        {/* Controls: Prev, Play/Pause, Next */}
        <div className="flex items-center gap-1.5 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handlePrevProduct}
            aria-label="Previous product"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            type="button"
            variant={isPlaying ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2.5 text-2xs font-medium gap-1"
            onClick={() => setIsPlaying(!isPlaying)}
            data-testid="cinema-play-pause-btn"
          >
            {isPlaying ? (
              <>
                <Pause className="size-3" />
                <span>{t('suppliers:cinemaPause', { defaultValue: 'Пауза' })}</span>
              </>
            ) : (
              <>
                <Play className="size-3" />
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
            aria-label="Next product"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Active Product Headline on White Studio Card */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/60">
        <div className="relative size-12 rounded-lg bg-white border border-border/60 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
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
            <ImageOff className="size-5 text-muted-foreground/60" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-3xs bg-background/80 border-border">
              {scenario.product.categoryName}
            </Badge>
            <Badge
              variant="outline"
              className="text-3xs border-primary/30 text-primary bg-primary/10"
            >
              {t('suppliers:cinemaCommissionBadge', {
                marketplace: scenario.marketplaceName,
                percent: scenario.marketplacePercent,
                defaultValue: '{{marketplace}} • {{percent}}% комісія',
              })}
            </Badge>
            <span className="font-mono text-3xs text-muted-foreground ml-auto">
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

      {/* 4 Storytelling Visual Phases Grid with Active Focus and Scheme Colors */}
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

      {/* Bottom Summary Banner with Shield & Counter */}
      <div className="p-3 rounded-xl bg-success/10 border border-success/20 flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-success shrink-0" />
          <span className="text-2xs sm:text-xs text-foreground font-medium">
            {t('suppliers:cinemaProtectionSummary', {
              name: scenario.marketplaceName,
              defaultValue:
                'SmartFeed захищає продавця: ви отримуєте рівно запланований дохід без втрат на комісіях {{name}}.',
            })}
          </span>
        </div>
        <div className="text-3xs font-mono text-muted-foreground ml-auto">
          {t('suppliers:cinemaProductCounter', {
            current: (productIndex % safeProducts.length) + 1,
            total: safeProducts.length,
            defaultValue: 'Товар {{current}} з {{total}}',
          })}
        </div>
      </div>
    </div>
  );
}
