/**
 * Detect if running inside Tauri native environment or web browser.
 */
declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);
