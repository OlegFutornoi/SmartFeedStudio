import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  RevenueGrowthPoint,
  AiActionLogItem,
  ShowcaseStageId,
} from '@/modules/growth-showcase/types';

interface UseGrowthCycleOptions {
  timeline: RevenueGrowthPoint[];
  aiActions: AiActionLogItem[];
  autoPlay?: boolean;
  intervalMs?: number;
}

export function useGrowthCycle({
  timeline,
  aiActions,
  autoPlay = true,
  intervalMs = 3200,
}: UseGrowthCycleOptions) {
  const [timelineIndex, setTimelineIndex] = useState(timeline.length - 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [actionIndex, setActionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const isTabVisibleRef = useRef(true);

  // Determine stage based on timeline position
  const activeStageId: ShowcaseStageId =
    timelineIndex <= 1 ? 'prep' : timelineIndex <= 3 ? 'sync' : 'revenue';

  const nextStep = useCallback(() => {
    setTimelineIndex((prev) => (prev + 1) % timeline.length);
    setActionIndex((prev) => (prev + 1) % aiActions.length);
  }, [timeline.length, aiActions.length]);

  const selectIndex = useCallback((index: number) => {
    setTimelineIndex(index);
  }, []);

  // Listen to tab visibility to save CPU
  useEffect(() => {
    const handleVisibility = () => {
      isTabVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!autoPlay || isPaused) return;

    const interval = setInterval(() => {
      if (isTabVisibleRef.current && hoveredIndex === null) {
        nextStep();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoPlay, isPaused, intervalMs, hoveredIndex, nextStep]);

  const currentIndex = hoveredIndex !== null ? hoveredIndex : timelineIndex;
  const currentPoint = timeline[currentIndex] || timeline[0];
  const currentAction = aiActions[actionIndex] || aiActions[0];

  return {
    currentIndex,
    currentPoint,
    currentAction,
    activeStageId,
    hoveredIndex,
    setHoveredIndex,
    selectIndex,
    setIsPaused,
  };
}
