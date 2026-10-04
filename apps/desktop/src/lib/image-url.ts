import { isTauri } from '@/lib/runtime';

let tauriConvertFn: ((filePath: string) => string) | null = null;

if (isTauri()) {
  import('@tauri-apps/api/core')
    .then((mod) => {
      tauriConvertFn = mod.convertFileSrc;
    })
    .catch((err) => {
      console.warn('[image-url] Failed to load Tauri convertFileSrc:', err);
    });
}

export function resolveImageSrc(
  pathOrUrl?: string | null,
  fallbackUrl?: string | null,
): string | null {
  if (!pathOrUrl && !fallbackUrl) return null;
  const target = pathOrUrl || fallbackUrl;
  if (!target) return null;

  // Remote URLs or data URLs
  if (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('data:') ||
    target.startsWith('blob:')
  ) {
    return target;
  }

  // Local filesystem path
  if (isTauri() && tauriConvertFn) {
    try {
      return tauriConvertFn(target);
    } catch (err) {
      console.warn('[image-url:resolveProductImageUrl] Tauri asset conversion failed:', err);
      return target;
    }
  }

  // If in web / mock mode and we have an original remote URL fallback
  if (fallbackUrl && (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://'))) {
    return fallbackUrl;
  }

  return target;
}
