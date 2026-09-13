import { fetchWithAuth } from '../api';
import { isTauri } from '../runtime';

export async function getDefaultWorkspacePath(): Promise<string> {
  // 1. Try Tauri IPC if in native app
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const specs = (await invoke('get_system_specs')) as { default_workspace?: string };
      if (specs?.default_workspace) return specs.default_workspace;
    } catch (e) {
      console.warn('[storage:getDefaultWorkspacePath] Tauri IPC fallback:', e);
    }
  }

  // 2. Try Backend API for real system OS path
  try {
    const res = await fetchWithAuth('/storage/workspace/default-path');
    if (res.ok) {
      const data = (await res.json()) as { defaultPath: string };
      if (data?.defaultPath) return data.defaultPath;
    }
  } catch (e) {
    console.warn('[storage:getDefaultWorkspacePath] API fallback:', e);
  }

  return '~/Documents/SmartFeedStudioData';
}

export async function openInFileManager(path: string): Promise<void> {
  // 1. Try Tauri IPC
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_in_file_manager', { path });
      return;
    } catch (e) {
      console.warn('[storage:openInFileManager] Failed in Tauri:', e);
    }
  }

  // 2. Call Backend API to trigger native OS open/explorer
  try {
    await fetchWithAuth('/storage/workspace/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
  } catch (e) {
    console.warn('[storage:openInFileManager] Failed via API:', e);
  }
}

export async function pickWorkspaceFolder(): Promise<string | null> {
  // 1. Try Tauri IPC if running in native app
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const chosen = (await invoke('pick_workspace_folder')) as string | null;
      if (chosen) return chosen;
    } catch (e) {
      console.warn('[storage:pickWorkspaceFolder] Tauri IPC error:', e);
    }
  }

  // 2. Try Backend API
  try {
    const res = await fetchWithAuth('/storage/workspace/select-folder', {
      method: 'POST',
    });
    if (res.ok) {
      const data = (await res.json()) as { path: string | null };
      if (data?.path) return data.path;
    }
  } catch (e) {
    console.warn('[storage:pickWorkspaceFolder] API error:', e);
  }

  // 3. Fallback: Browser showDirectoryPicker if available
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const win = window as Window & { showDirectoryPicker?: () => Promise<{ name?: string }> };
      const dirHandle = await win.showDirectoryPicker?.();
      if (dirHandle?.name) {
        return `~/Documents/${dirHandle.name}`;
      }
    } catch (e) {
      console.warn('[storage:pickWorkspaceFolder] Browser directory picker error/cancel:', e);
    }
  }

  return null;
}
