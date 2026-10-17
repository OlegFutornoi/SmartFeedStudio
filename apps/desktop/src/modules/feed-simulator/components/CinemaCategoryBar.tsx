import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Smartphone,
  Shirt,
  Sparkles,
  Wrench,
  Tag,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { SimulatorProduct } from '@/modules/feed-simulator/types';

interface CinemaCategoryBarProps {
  products: SimulatorProduct[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

const ICON_MAP = {
  Lightbulb,
  Smartphone,
  Shirt,
  Sparkles,
  Wrench,
  Tag,
};

export function CinemaCategoryBar({
  products,
  activeIndex,
  onSelectIndex,
}: CinemaCategoryBarProps) {
  const { t } = useTranslation(['suppliers', 'common']);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
          {t('suppliers:cinemaSceneLabel', {
            current: activeIndex + 1,
            total: products.length,
            defaultValue: `Сцена ${activeIndex + 1} з ${products.length}`,
          })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground"
            disabled={activeIndex === 0}
            onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
            data-testid="cinema-prev-scene-btn"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground"
            disabled={activeIndex >= products.length - 1}
            onClick={() => onSelectIndex(Math.min(products.length - 1, activeIndex + 1))}
            data-testid="cinema-next-scene-btn"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        data-testid="cinema-category-bar"
      >
        {products.map((p, idx) => {
          const IconComp = ICON_MAP[p.categoryIcon] || Tag;
          const isActive = idx === activeIndex;

          return (
            <Button
              key={p.id}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectIndex(idx)}
              data-testid={`cinema-category-tab-${idx}`}
              className={`shrink-0 h-7 px-2.5 text-2xs font-medium gap-1.5 rounded-lg border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/70'
              }`}
            >
              <IconComp className="size-3 shrink-0" />
              <span className="truncate max-w-[120px]">{p.categoryName}</span>
              <span
                className={`font-mono text-3xs px-1 rounded ${isActive ? 'bg-black/20' : 'bg-muted'}`}
              >
                {p.marketplaceCommissionPercent}%
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
