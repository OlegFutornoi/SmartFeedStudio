import { isTauri } from '../lib/runtime';
export { isTauri };

export async function storeRefreshToken(token: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('store_refresh_token', { token });
  } else {
    localStorage.setItem('sf_dev_refresh_token', token);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<string | null>('get_refresh_token');
  } else {
    return localStorage.getItem('sf_dev_refresh_token');
  }
}

export async function deleteRefreshToken(): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('delete_refresh_token');
  } else {
    localStorage.removeItem('sf_dev_refresh_token');
  }
}
