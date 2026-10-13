import React, { useState } from 'react';
import { Info, Sparkles, CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageGuide } from '@/hooks/usePageGuide';
import { useAiAssistantProfile } from '@/hooks/useAiAssistantProfile';
import { useTranslation } from '@/i18n';

interface PageHeaderGuideProps {
  route: string;
}

export const PageHeaderGuide: React.FC<PageHeaderGuideProps> = ({ route }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { guide } = usePageGuide(route);
  const { avatarUrl, name, roleUk, roleEn, badgeUk, badgeEn } = useAiAssistantProfile();
  const { t, language } = useTranslation(['common']);
  const isUk = language === 'uk';

  const title = isUk ? guide.titleUk : guide.titleEn;
  const badge = isUk ? guide.badgeUk : guide.badgeEn;
  const description = isUk ? guide.descriptionUk : guide.descriptionEn;
  const features = isUk ? guide.featuresUk : guide.featuresEn;
  const proTip = isUk ? guide.proTipUk : guide.proTipEn;
  const assistantBadge = isUk ? badgeUk : badgeEn;
  const assistantRole = isUk ? roleUk : roleEn;

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              data-testid="page-header-guide-trigger"
              className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
              aria-label={isUk ? 'Довідка від AI Асистента' : 'AI Assistant Guide'}
            >
              <Info className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {isUk ? 'Що це за розділ? Довідка від AI' : 'About this section • AI Guide'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          data-testid="page-header-guide-modal"
          className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-card border border-border/80 p-5 gap-4 shadow-xl rounded-xl"
        >
          {/* Header with 3D AI Assistant Photo */}
          <DialogHeader className="space-y-0 text-left">
            <div className="flex items-start gap-3.5">
              {/* 3D AI Holographic Avatar */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl overflow-hidden border border-emerald-500/40 bg-background/80 shadow-md ring-2 ring-emerald-500/20">
                  <img
                    src={avatarUrl}
                    alt={name}
                    data-testid="page-guide-ai-avatar"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                {/* Active pulse dot */}
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background">
                  <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              </div>

              {/* Title & Role */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{title}</span>
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono"
                  >
                    {assistantBadge}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground leading-snug">
                  <span className="font-medium text-foreground">{name}</span> • {assistantRole} •{' '}
                  {badge}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="space-y-3.5 py-1 text-xs">
            {/* Description Paragraph */}
            <p className="text-foreground/90 leading-relaxed">{description}</p>

            {/* Key Capabilities / Features */}
            {features && features.length > 0 && (
              <div className="space-y-1.5 rounded-lg border border-border/80 bg-muted/30 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isUk ? 'Ключові можливості:' : 'Key Capabilities:'}
                </p>
                <ul className="space-y-1.5">
                  {features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-foreground/90 leading-snug"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Pro-Tip Box */}
            {proTip && (
              <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-foreground/90">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-primary">
                    {isUk ? 'Порада від AI Асистента' : 'AI Assistant Pro-Tip'}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{proTip}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs h-8 px-4"
              data-testid="page-guide-close-btn"
            >
              {t('common:close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
