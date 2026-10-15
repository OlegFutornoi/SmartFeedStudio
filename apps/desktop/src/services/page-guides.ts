import {
  PageGuideDto,
  AiAssistantProfileDto,
  DEFAULT_PAGE_GUIDES,
  DEFAULT_AI_ASSISTANT_PROFILE,
} from '@smartfeed/shared';
import { fetchWithAuth } from '@/lib/api/client';

let cachedAssistantProfile: AiAssistantProfileDto | null = null;
let cachedGuides: Record<string, PageGuideDto> = {};
let lastFetchTime = 0;
let inFlightProfilePromise: Promise<AiAssistantProfileDto> | null = null;
const inFlightRequests: Record<string, Promise<PageGuideDto> | undefined> = {};

// 2-minute memory TTL for static guides per FE-14
const PROFILE_TTL_MS = 120000;

/**
 * Fetch current AI Assistant profile (photo & metadata) with in-flight dedup and offline fallback.
 */
export async function getAiAssistantProfile(token?: string): Promise<AiAssistantProfileDto> {
  const now = Date.now();
  if (cachedAssistantProfile && now - lastFetchTime < PROFILE_TTL_MS) {
    return cachedAssistantProfile;
  }

  if (inFlightProfilePromise) {
    return inFlightProfilePromise;
  }

  inFlightProfilePromise = (async () => {
    try {
      const res = await fetchWithAuth('/page-guides/assistant/profile', { method: 'GET' }, token);
      if (res.ok) {
        const data = await res.json();
        cachedAssistantProfile = data;
        lastFetchTime = Date.now();
        return data;
      }
    } catch (err) {
      console.warn('[PageGuides] Offline fallback for AI Assistant profile:', err);
    } finally {
      inFlightProfilePromise = null;
    }

    return cachedAssistantProfile || DEFAULT_AI_ASSISTANT_PROFILE;
  })();

  return inFlightProfilePromise;
}

/**
 * Fetch page guide for a specific route with in-flight dedup and instant offline fallback.
 */
export async function getPageGuide(route: string, token?: string): Promise<PageGuideDto> {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  const routeKey = normalizedRoute === '/' ? 'dashboard' : normalizedRoute.replace(/^\//, '');

  if (cachedGuides[normalizedRoute]) {
    return cachedGuides[normalizedRoute];
  }

  const existingInFlight = inFlightRequests[normalizedRoute];
  if (existingInFlight) {
    return existingInFlight;
  }

  const promise = (async () => {
    try {
      const res = await fetchWithAuth(
        `/page-guides/${encodeURIComponent(routeKey)}`,
        { method: 'GET' },
        token,
      );
      if (res.ok) {
        const data = await res.json();
        cachedGuides[normalizedRoute] = data;
        return data;
      }
    } catch (err) {
      console.warn(`[PageGuides] Offline fallback for route ${normalizedRoute}:`, err);
    } finally {
      delete inFlightRequests[normalizedRoute];
    }

    // Instant canonical fallback
    const fallback =
      DEFAULT_PAGE_GUIDES[normalizedRoute] ||
      (normalizedRoute === '/plans' ? DEFAULT_PAGE_GUIDES['/license'] : undefined) ||
      (normalizedRoute === '/ai-enrichment' ? DEFAULT_PAGE_GUIDES['/ai'] : undefined) ||
      DEFAULT_PAGE_GUIDES['/'];
    const profile = cachedAssistantProfile || DEFAULT_AI_ASSISTANT_PROFILE;
    const guide = { ...fallback, assistant: profile };
    cachedGuides[normalizedRoute] = guide;
    return guide;
  })();

  inFlightRequests[normalizedRoute] = promise;
  return promise;
}

/**
 * Invalidate cached guides when settings update.
 */
export function invalidatePageGuidesCache(): void {
  cachedAssistantProfile = null;
  cachedGuides = {};
  lastFetchTime = 0;
}
