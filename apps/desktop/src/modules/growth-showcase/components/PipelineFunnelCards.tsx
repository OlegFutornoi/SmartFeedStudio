import type { FunnelStageItem, ShowcaseStageId } from '@/modules/growth-showcase/types';
import { PackageCheck, Rocket, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PipelineFunnelCardsProps {
  stages: FunnelStageItem[];
  activeStageId: ShowcaseStageId;
  onSelectStage: (id: ShowcaseStageId) => void;
  isUk: boolean;
}

export function PipelineFunnelCards({
  stages,
  activeStageId,
  onSelectStage,
  isUk,
}: PipelineFunnelCardsProps) {
  const getIcon = (iconName: FunnelStageItem['iconName'], isActive: boolean) => {
    const className = `h-3.5 w-3.5 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`;
    switch (iconName) {
      case 'PackageCheck':
        return <PackageCheck className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
    }
  };

  return (
    <div data-testid="pipeline-funnel-cards" className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {stages.map((stage) => {
        const isActive = stage.id === activeStageId;

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelectStage(stage.id)}
            className={`group relative flex flex-col text-left justify-between gap-1 rounded-xl border p-2 transition-all duration-300 ${
              isActive
                ? 'border-emerald-500/50 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/30'
                : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/70'
            }`}
          >
            {/* Header: Icon, Step # & Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-background border border-border/60 text-[10px] font-bold">
                  {stage.stepNumber}
                </span>
                {getIcon(stage.iconName, isActive)}
              </div>

              <Badge
                variant="outline"
                className={`px-1.5 py-0 text-[9px] font-semibold ${
                  isActive
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {isUk ? stage.badgeUk : stage.badgeEn}
              </Badge>
            </div>

            {/* Title & Subtitle */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight text-foreground">
                {isUk ? stage.titleUk : stage.titleEn}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isUk ? stage.subtitleUk : stage.subtitleEn}
              </span>
            </div>

            {/* Key Stat pill */}
            <div className="mt-0.5 flex items-center justify-between border-t border-border/40 pt-1.5 text-[10px]">
              <span className="font-semibold text-foreground">
                {isUk ? stage.statPrimaryUk : stage.statPrimaryEn}
              </span>
              <span className="text-muted-foreground">
                {isUk ? stage.statSecondaryUk : stage.statSecondaryEn}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
