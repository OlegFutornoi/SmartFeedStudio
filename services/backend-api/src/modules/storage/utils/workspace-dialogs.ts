/**
 * Server-side workspace folder dialog stub.
 * Note: Remote backend API runs headless (Docker / Linux / Cloud). GUI dialogs
 * are exclusively handled natively by Tauri client on the desktop (src-tauri).
 */

export async function selectFolderDialog(): Promise<string | null> {
  // Headless backend does not spawn desktop GUI windows to prevent DoS (CWE-400)
  return null;
}
