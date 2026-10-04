import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  WorkspaceInfoDto,
  StorageStatsDto,
  DatabaseMaintenanceResultDto,
} from '@smartfeed/shared';
import { useAuth } from '@/contexts/AuthContext';
import {
  getWorkspaceInfo,
  initWorkspace,
  getStorageStats,
  createLocalBackup,
  runDatabaseMaintenance,
  clearStorageCache,
  openInFileManager,
  getDefaultWorkspacePath,
} from '@/lib/storageApi';

interface WorkspaceStorageContextType {
  workspaceInfo: WorkspaceInfoDto | null;
  storageStats: StorageStatsDto | null;
  isInitialized: boolean;
  isLoading: boolean;
  showOnboardingModal: boolean;
  defaultPath: string;
  setupWorkspace: (path: string) => Promise<WorkspaceInfoDto>;
  refreshStats: () => Promise<void>;
  backupDatabase: () => Promise<string>;
  optimizeDatabase: () => Promise<DatabaseMaintenanceResultDto>;
  clearCache: () => Promise<number>;
  openFolder: () => Promise<void>;
  setShowOnboardingModal: (show: boolean) => void;
}

const WorkspaceStorageContext = createContext<WorkspaceStorageContextType | undefined>(undefined);

export const WorkspaceStorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfoDto | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStatsDto | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(true); // Default true until checked
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [defaultPath, setDefaultPath] = useState<string>('~/Documents/SmartFeedStudioData');

  const isCheckingRef = useRef(false);

  const checkWorkspace = useCallback(async () => {
    if (!isAuthenticated || isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsLoading(true);

    try {
      const def = await getDefaultWorkspacePath();
      setDefaultPath(def);

      const info = await getWorkspaceInfo();
      const isExplicitlyPending =
        localStorage.getItem('smartfeed_show_workspace_onboarding') === 'true';
      const isExplicitlyUninit =
        localStorage.getItem('smartfeed_workspace_initialized') === 'false';

      if (info && info.isInitialized && !isExplicitlyPending && !isExplicitlyUninit) {
        setWorkspaceInfo(info);
        setIsInitialized(true);
        setShowOnboardingModal(false);
        const stats = await getStorageStats(info.workspacePath);
        setStorageStats(stats);
      } else {
        // Workspace directory or database does not exist on disk!
        // Show setup modal as during first-run / registration
        localStorage.removeItem('smartfeed_workspace_initialized');
        setWorkspaceInfo(null);
        setIsInitialized(false);
        setShowOnboardingModal(true);
      }
    } catch (e) {
      console.warn('Workspace check error:', e);
      setWorkspaceInfo(null);
      setIsInitialized(false);
      setShowOnboardingModal(true);
    } finally {
      setIsLoading(false);
      isCheckingRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      checkWorkspace();
    } else {
      setWorkspaceInfo(null);
      setIsInitialized(false);
      setShowOnboardingModal(false);
    }
  }, [isAuthenticated, checkWorkspace]);

  const setupWorkspace = useCallback(async (path: string): Promise<WorkspaceInfoDto> => {
    setIsLoading(true);
    try {
      const info = await initWorkspace(path);
      setWorkspaceInfo(info);
      setIsInitialized(true);
      setShowOnboardingModal(false);
      const stats = await getStorageStats(info.workspacePath);
      setStorageStats(stats);
      return info;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    if (!workspaceInfo) return;
    try {
      const stats = await getStorageStats(workspaceInfo.workspacePath);
      setStorageStats(stats);
    } catch (e) {
      console.warn('Failed to refresh stats:', e);
    }
  }, [workspaceInfo]);

  const backupDatabase = useCallback(async (): Promise<string> => {
    const res = await createLocalBackup();
    await refreshStats();
    return res.backupPath;
  }, [refreshStats]);

  const optimizeDatabase = useCallback(async (): Promise<DatabaseMaintenanceResultDto> => {
    const res = await runDatabaseMaintenance();
    await refreshStats();
    return res;
  }, [refreshStats]);

  const clearCache = useCallback(async (): Promise<number> => {
    const res = await clearStorageCache();
    await refreshStats();
    return res.bytesFreed;
  }, [refreshStats]);

  const openFolder = useCallback(async () => {
    if (workspaceInfo?.workspacePath) {
      await openInFileManager(workspaceInfo.workspacePath);
    }
  }, [workspaceInfo]);

  return (
    <WorkspaceStorageContext.Provider
      value={{
        workspaceInfo,
        storageStats,
        isInitialized,
        isLoading,
        showOnboardingModal,
        defaultPath,
        setupWorkspace,
        refreshStats,
        backupDatabase,
        optimizeDatabase,
        clearCache,
        openFolder,
        setShowOnboardingModal,
      }}
    >
      {children}
    </WorkspaceStorageContext.Provider>
  );
};

export const useWorkspaceStorage = () => {
  const context = useContext(WorkspaceStorageContext);
  if (!context) {
    throw new Error('useWorkspaceStorage must be used within a WorkspaceStorageProvider');
  }
  return context;
};
