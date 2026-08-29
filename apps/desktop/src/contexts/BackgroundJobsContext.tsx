import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getActiveImportJobs, getImportJobStatus, ImportJobDto } from '@/lib/api';
import { useAuth } from './AuthContext';
import { useQuotas } from '@/hooks/useQuotas';
import { emitDataSync } from '@/lib/syncEvents';

export type BackgroundJobKind =
  'IMPORT' | 'DELETE_FEED' | 'DELETE_CATEGORIES' | 'DELETE_SUPPLIER' | 'SYNC';

export interface BackgroundTaskItem {
  id: string;
  kind: BackgroundJobKind;
  title: string;
  subtitle?: string;
  totalItems?: number;
  processedItems?: number;
  progressPercent?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  startedAt: number;
}

interface BackgroundJobsContextType {
  activeJobs: ImportJobDto[];
  backgroundTasks: BackgroundTaskItem[];
  hasActiveJobs: boolean;
  addTrackedJob: (jobId: string) => void;
  runBackgroundTask: <T>(params: {
    id?: string;
    kind: BackgroundJobKind;
    title: string;
    subtitle?: string;
    totalItems?: number;
    action: () => Promise<T>;
  }) => Promise<T>;
  dismissTask: (taskId: string) => void;
  refreshActiveJobs: () => Promise<void>;
}

const BackgroundJobsContext = createContext<BackgroundJobsContextType | undefined>(undefined);

export function BackgroundJobsProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const { refreshQuotas } = useQuotas();
  const [activeJobs, setActiveJobs] = useState<ImportJobDto[]>([]);
  const [backgroundTasks, setBackgroundTasks] = useState<BackgroundTaskItem[]>([]);
  const trackedJobIdsRef = useRef<Set<string>>(new Set());
  const isPollingRef = useRef<boolean>(false);

  const refreshActiveJobs = useCallback(async () => {
    if (!token || !isAuthenticated || isPollingRef.current) return;

    try {
      isPollingRef.current = true;
      const jobs = await getActiveImportJobs(token);
      setActiveJobs(jobs);

      // Check if any previously tracked jobs finished
      for (const id of Array.from(trackedJobIdsRef.current)) {
        const stillActive = jobs.some((j) => j.id === id);
        if (!stillActive) {
          // Job finished! Check status once
          try {
            const finishedJob = await getImportJobStatus(id, token);
            if (finishedJob.status === 'COMPLETED') {
              await refreshQuotas(true);
              emitDataSync('all', { force: true });
            }
          } catch {
            // Ignore finished job fetch error
          }
          trackedJobIdsRef.current.delete(id);
        }
      }
    } catch {
      // Ignore background network errors
    } finally {
      isPollingRef.current = false;
    }
  }, [token, isAuthenticated, refreshQuotas]);

  const addTrackedJob = useCallback(
    (jobId: string) => {
      trackedJobIdsRef.current.add(jobId);
      refreshActiveJobs();
    },
    [refreshActiveJobs],
  );

  const runBackgroundTask = useCallback(
    async <T,>(params: {
      id?: string;
      kind: BackgroundJobKind;
      title: string;
      subtitle?: string;
      totalItems?: number;
      action: () => Promise<T>;
    }): Promise<T> => {
      const taskId = params.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newTask: BackgroundTaskItem = {
        id: taskId,
        kind: params.kind,
        title: params.title,
        subtitle: params.subtitle,
        totalItems: params.totalItems,
        processedItems: 0,
        progressPercent: 0,
        status: 'PROCESSING',
        startedAt: Date.now(),
      };

      setBackgroundTasks((prev) => [...prev, newTask]);

      try {
        const result = await params.action();

        // Mark as completed
        setBackgroundTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: 'COMPLETED', progressPercent: 100, processedItems: t.totalItems }
              : t,
          ),
        );

        // Auto-refresh quotas and dispatch unified sync event
        await refreshQuotas(true);
        emitDataSync('all', { force: true });

        // Auto remove completed task after 2s
        setTimeout(() => {
          setBackgroundTasks((prev) => prev.filter((t) => t.id !== taskId));
        }, 2000);

        return result;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Не вдалося виконати фонову операцію';
        setBackgroundTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: 'FAILED', errorMessage: errorMsg } : t,
          ),
        );

        // Auto remove failed task after 4s
        setTimeout(() => {
          setBackgroundTasks((prev) => prev.filter((t) => t.id !== taskId));
        }, 4000);

        throw err;
      }
    },
    [refreshQuotas],
  );

  const dismissTask = useCallback((taskId: string) => {
    setBackgroundTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  // Initial fetch on auth
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshActiveJobs();
    } else {
      setActiveJobs([]);
      setBackgroundTasks([]);
      trackedJobIdsRef.current.clear();
    }
  }, [isAuthenticated, token, refreshActiveJobs]);

  // Polling loop: only runs when activeJobs.length > 0 or trackedJobIdsRef has entries
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const hasJobsToTrack = activeJobs.length > 0 || trackedJobIdsRef.current.size > 0;
    if (!hasJobsToTrack) return;

    const interval = setInterval(() => {
      refreshActiveJobs();
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, activeJobs.length, refreshActiveJobs]);

  const hasActiveJobs =
    activeJobs.length > 0 || backgroundTasks.some((t) => t.status === 'PROCESSING');

  return (
    <BackgroundJobsContext.Provider
      value={{
        activeJobs,
        backgroundTasks,
        hasActiveJobs,
        addTrackedJob,
        runBackgroundTask,
        dismissTask,
        refreshActiveJobs,
      }}
    >
      {children}
    </BackgroundJobsContext.Provider>
  );
}

export function useBackgroundJobs() {
  const context = useContext(BackgroundJobsContext);
  if (!context) {
    throw new Error('useBackgroundJobs must be used within BackgroundJobsProvider');
  }
  return context;
}
