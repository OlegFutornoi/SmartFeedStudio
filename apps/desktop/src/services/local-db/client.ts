import { isTauri } from '@/lib/runtime';
import { executeMockCommand } from '@/services/local-db/mock-executor';
import { prepareTauriArgs, REGISTERED_TAURI_COMMANDS } from '@/services/local-db/tauri-args';
import type { LocalDbCommandMap } from '@/services/local-db/types';

/**
 * Universal Local Database Dispatcher:
 * - When running in Tauri native app -> routes to Rust SQLCipher commands.
 * - When running in Web / Playwright E2E -> routes to high-speed In-Memory driver.
 */
export async function invokeLocalDb<K extends keyof LocalDbCommandMap>(
  command: K,
  args: LocalDbCommandMap[K]['args'],
): Promise<LocalDbCommandMap[K]['result']> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const tauriArgs = prepareTauriArgs(command, args);
      return (await invoke(command, tauriArgs)) as LocalDbCommandMap[K]['result'];
    } catch (error) {
      console.warn(`[LocalDB IPC] Tauri invoke('${command}') error:`, error);
      // For registered native commands, propagate error so UI handles it instead of silently desyncing
      if (REGISTERED_TAURI_COMMANDS.has(command)) {
        throw error;
      }
    }
  }

  // Fallback / Browser Test Mode
  return executeMockCommand(command, args);
}
