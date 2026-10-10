import { useTranslation } from '@/i18n';
import { Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_SHOWCASE_CONFIG } from '@/modules/growth-showcase/config';
import type { ShowcaseStageId } from '@/modules/growth-showcase/types';
import { useGrowthCycle } from '@/modules/growth-showcase/hooks/useGrowthCycle';
import { AiCopilotCard } from '@/modules/growth-showcase/components/AiCopilotCard';
import { RevenueGrowthChart } from '@/modules/growth-showcase/components/RevenueGrowthChart';
import { PipelineFunnelCards } from '@/modules/growth-showcase/components/PipelineFunnelCards';
import { LiveSalesTicker } from '@/modules/growth-showcase/components/LiveSalesTicker';

export interface GrowthShowcaseModuleProps {
  className?: string;
  autoPlay?: boolean;
  intervalMs?: number;
}

export function GrowthShowcaseModule({
  className = '',
  autoPlay = true,
  intervalMs = 3200,
}: GrowthShowcaseModuleProps) {
  const { language } = useTranslation();
  const isUk = language === 'uk';

  const { currentIndex, currentAction, activeStageId, setHoveredIndex, selectIndex } =
    useGrowthCycle({
      timeline: DEFAULT_SHOWCASE_CONFIG.timeline,
      aiActions: DEFAULT_SHOWCASE_CONFIG.aiActions,
      autoPlay,
      intervalMs,
    });

  const handleStageSelect = (stageId: ShowcaseStageId) => {
    if (stageId === 'prep') selectIndex(0);
    else if (stageId === 'sync') selectIndex(2);
    else selectIndex(4);
  };

  return (
    <div
      data-testid="growth-showcase-module"
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden p-4 sm:p-5 lg:p-6 ${className}`}
    >
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(0,0,0,0))]" />

      {/* 1. Header: AI Proposition & Value Headline */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-foreground backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <span>SmartFeed AI 2.0</span>
          </Badge>
          <span className="text-xs text-muted-foreground">
            • {isUk ? 'Автономний ріст продажів' : 'Autonomous Sales Growth'}
          </span>
        </div>

        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl leading-snug">
          {isUk
            ? 'Ваш автономний AI-асистент для маркетплейсів'
            : 'Your Autonomous AI Marketplace Copilot'}
        </h2>
        <p className="max-w-xl text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
          {isUk
            ? 'Підготує каталоги, вивантажить товари на маркетплейси та максимізує прибуток 24/7 без вашої рутини.'
            : 'Prepares catalogs, syncs products across marketplaces, and maximizes profits 24/7 on autopilot.'}
        </p>
      </div>

      {/* 2. Visual Centerpiece: AI Copilot Card */}
      <div className="my-1.5">
        <AiCopilotCard currentAction={currentAction} isUk={isUk} />
      </div>

      {/* 3. Recharts AreaChart: Dynamic Revenue & Net Profit curve */}
      <div className="my-1">
        <RevenueGrowthChart
          timeline={DEFAULT_SHOWCASE_CONFIG.timeline}
          currentIndex={currentIndex}
          onHoverPoint={setHoveredIndex}
          onSelectPoint={selectIndex}
          isUk={isUk}
        />
      </div>

      {/* 4. 3-Stage Success Pipeline: Prep -> Sync -> Scale */}
      <div className="my-1.5">
        <PipelineFunnelCards
          stages={DEFAULT_SHOWCASE_CONFIG.stages}
          activeStageId={activeStageId}
          onSelectStage={handleStageSelect}
          isUk={isUk}
        />
      </div>

      {/* 5. Live Marketplace Order Stream Ticker */}
      <div className="my-0.5">
        <LiveSalesTicker orders={DEFAULT_SHOWCASE_CONFIG.recentOrders} isUk={isUk} />
      </div>

      {/* 6. Footer Trust & Enterprise Bar */}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Zap className="h-3 w-3 text-emerald-500" />
          <span>{isUk ? '10 000+ SKU за секунди' : '10,000+ SKUs in seconds'}</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-cyan-500" />
          <span>{isUk ? '99.98% точність залишків' : '99.98% stock accuracy'}</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <span>Enterprise Autopilot</span>
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
