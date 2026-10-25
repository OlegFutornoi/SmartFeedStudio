import { isTauri } from '@/lib/runtime';
import { prepareTauriArgs, REGISTERED_TAURI_COMMANDS } from '@/services/local-db/tauri-args';
import type { LocalDbCommandMap } from '@/services/local-db/types';

const DOCKER_SQLITE_URL = import.meta.env.VITE_LOCAL_DB_URL || 'http://localhost:5001';

/**
 * Universal Local Database Dispatcher:
 * - When running in Tauri native app -> routes to Rust SQLCipher commands.
 * - When running in Web development -> routes directly to real Docker SQLite on port 5001.
 * - 100% database parity between Web and Tauri: no fake in-memory mocks.
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

  // Real Local SQLite in Docker (port 5001)
  try {
    const res = await fetch(`${DOCKER_SQLITE_URL}/api/invoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, args }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data as LocalDbCommandMap[K]['result'];
    }
    const errText = await res.text();
    console.error(`[LocalDB Docker SQLite] Error for '${command}':`, errText);
    throw new Error(`[LocalDB Docker SQLite] ${errText}`);
  } catch (err) {
    console.error(
      `[LocalDB Docker SQLite] Failed to reach SQLite container on port 5001 for '${command}':`,
      err,
    );
    throw err;
  }
}
