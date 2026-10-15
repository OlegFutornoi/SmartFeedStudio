/**
 * Bank Logo Offline Cache & Vector Fallbacks
 * Caches bank logos in localStorage / dataURL format with updatedAt version checks.
 * Provides instant embedded SVG fallbacks for top Ukrainian banks.
 */

interface CachedBankLogo {
  dataUrl: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'smartfeed_bank_logo_';

/**
 * Embedded SVG icons for Ukrainian banks (crisp 20x20 vector badges)
 */
export const DEFAULT_BANK_SVGS: Record<string, string> = {
  nbu: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#1e293b"/><path d="M4 20h16M4 10h16M6 10v10M18 10v10M10 10v10M14 10v10M12 4l8 4H4l8-4z" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  privat: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#16a34a"/><path d="M7 6h6a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H7V6z" fill="#ffffff"/><path d="M10 9h3a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1h-3V9z" fill="#16a34a"/><rect x="7" y="14" width="3" height="4" fill="#ffffff"/></svg>`,
  mono: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#09090b"/><circle cx="12" cy="12" r="7" fill="#ffffff"/><path d="M9 11c0-1.5 1.3-3 3-3s3 1.5 3 3v4h-6v-4z" fill="#09090b"/><circle cx="10.5" cy="11.5" r="0.75" fill="#ffffff"/><circle cx="13.5" cy="11.5" r="0.75" fill="#ffffff"/></svg>`,
  raiffeisen: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#facc15"/><path d="M6 6l12 12M18 6L6 18" stroke="#09090b" stroke-width="3" stroke-linecap="round"/></svg>`,
  pumb: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#dc2626"/><circle cx="12" cy="12" r="5" stroke="#ffffff" stroke-width="2.2"/><path d="M12 9v6" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};

/**
 * Returns cached bank logo data URL or fallback SVG.
 * Triggers background refresh if updatedAt changed on the server.
 */
export function getBankLogoSrc(
  bankId: string,
  remoteLogoUrl?: string | null,
  updatedAt?: string,
): string {
  const normId = bankId.toLowerCase();

  if (typeof window === 'undefined') {
    return `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_BANK_SVGS[normId] || DEFAULT_BANK_SVGS.nbu)}`;
  }

  try {
    const cachedRaw = localStorage.getItem(`${STORAGE_PREFIX}${normId}`);
    if (cachedRaw) {
      const cached: CachedBankLogo = JSON.parse(cachedRaw);
      if (!updatedAt || cached.updatedAt === updatedAt) {
        return cached.dataUrl;
      }
    }
  } catch (err) {
    console.warn('[bankLogoCache] Error reading cache:', err);
  }

  // Trigger background sync if a valid HTTP remote URL is provided
  if (remoteLogoUrl && remoteLogoUrl.startsWith('http')) {
    void cacheRemoteLogo(normId, remoteLogoUrl, updatedAt || new Date().toISOString());
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_BANK_SVGS[normId] || DEFAULT_BANK_SVGS.nbu)}`;
}

/**
 * Downloads remote image blob and saves base64 into localStorage for 100% offline access
 */
export async function cacheRemoteLogo(
  bankId: string,
  url: string,
  updatedAt: string,
): Promise<void> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return;

    const blob = await res.blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (dataUrl && typeof window !== 'undefined') {
        const payload: CachedBankLogo = { dataUrl, updatedAt };
        try {
          localStorage.setItem(`${STORAGE_PREFIX}${bankId}`, JSON.stringify(payload));
        } catch {
          // localStorage quota exceeded safeguard
        }
      }
    };
    reader.readAsDataURL(blob);
  } catch (err) {
    console.warn(`[bankLogoCache] Failed to download logo for ${bankId}:`, err);
  }
}
