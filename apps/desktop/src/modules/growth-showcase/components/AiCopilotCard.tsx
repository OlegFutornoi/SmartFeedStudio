import type { AiActionLogItem } from '@/modules/growth-showcase/types';
import { useAiAssistantProfile } from '@/hooks/useAiAssistantProfile';
import { Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AiCopilotCardProps {
  currentAction: AiActionLogItem;
  isUk: boolean;
}

export function AiCopilotCard({ currentAction, isUk }: AiCopilotCardProps) {
  const { avatarUrl, name } = useAiAssistantProfile();

  return (
    <div
      data-testid="ai-copilot-card"
      className="relative flex items-center gap-3 rounded-xl border border-primary/20 bg-card p-2.5 sm:p-3 shadow-sm transition-all duration-300"
    >
      {/* 3D Holographic AI Agent Avatar with Glowing Orb Ring */}
      <div className="relative shrink-0">
        <div className="relative h-12 w-12 sm:h-13 sm:w-13 overflow-hidden rounded-xl border border-success/40 bg-background shadow-md ring-2 ring-success/20">
          <img
            src={avatarUrl}
            alt={name || 'SmartFeed AI Copilot'}
            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
          />
        </div>
        {/* Pulsing Green Autopilot Active Dot */}
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background">
          <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
      </div>

      {/* Main Copilot Status & Rotating Action */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Top Header Badge & Tag */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className="gap-1 border-success/30 bg-success/15 px-2 py-0.5 text-2xs font-semibold text-success"
            >
              <Bot className="h-3 w-3" />
              <span>{isUk ? 'AI Автопілот 24/7' : '24/7 AI Autopilot'}</span>
            </Badge>
            <span className="hidden text-2xs text-muted-foreground sm:inline">
              • {isUk ? 'Робить усю рутину' : 'Automates all routine'}
            </span>
          </div>

          <span className="font-mono text-2xs text-muted-foreground/80">
            {currentAction.timestampText}
          </span>
        </div>

        {/* Dynamic Action Message with Fade transition */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-success" />
          <span className="truncate">{isUk ? currentAction.textUk : currentAction.textEn}</span>
        </div>

        {/* Live Sub-Status Tag */}
        <div className="flex items-center gap-2 text-2xs text-muted-foreground">
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-3 w-3" />
            <span>{isUk ? 'Автономна дія' : 'Autonomous action'}</span>
          </span>
          <span>•</span>
          <span className="rounded bg-muted/60 px-1.5 py-0.2 font-medium">
            {isUk ? currentAction.tagUk : currentAction.tagEn}
          </span>
        </div>
      </div>
    </div>
  );
}
