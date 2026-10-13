import {
  PageGuideDto,
  AiAssistantProfileDto,
  DEFAULT_PAGE_GUIDES,
  DEFAULT_AI_ASSISTANT_PROFILE,
} from '@smartfeed/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let cachedAssistantProfile: AiAssistantProfileDto | null = null;
let cachedGuides: Record<string, PageGuideDto> = {};
let lastFetchTime = 0;

/**
 * Fetch current AI Assistant profile (photo & metadata) with offline fallback.
 */
export async function getAiAssistantProfile(token?: string): Promise<AiAssistantProfileDto> {
  const now = Date.now();
  if (cachedAssistantProfile && now - lastFetchTime < 10000) {
    return cachedAssistantProfile;
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/page-guides/assistant/profile`, { headers });
    if (res.ok) {
      const data = await res.json();
      cachedAssistantProfile = data;
      lastFetchTime = now;
      return data;
    }
  } catch (err) {
    console.warn('[PageGuides] Offline fallback for AI Assistant profile:', err);
  }

  return DEFAULT_AI_ASSISTANT_PROFILE;
}

/**
 * Fetch page guide for a specific route with instant offline fallback.
 */
export async function getPageGuide(route: string, token?: string): Promise<PageGuideDto> {
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  const routeKey = normalizedRoute === '/' ? 'dashboard' : normalizedRoute.replace(/^\//, '');

  if (cachedGuides[normalizedRoute]) {
    return cachedGuides[normalizedRoute];
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/page-guides/${encodeURIComponent(routeKey)}`, {
      headers,
    });
    if (res.ok) {
      const data = await res.json();
      cachedGuides[normalizedRoute] = data;
      return data;
    }
  } catch (err) {
    console.warn(`[PageGuides] Offline fallback for route ${normalizedRoute}:`, err);
  }

  // Instant canonical fallback
  const fallback = DEFAULT_PAGE_GUIDES[normalizedRoute] || DEFAULT_PAGE_GUIDES['/'];
  const profile = cachedAssistantProfile || DEFAULT_AI_ASSISTANT_PROFILE;
  return { ...fallback, assistant: profile };
}

/**
 * Invalidate cached guides when settings update.
 */
export function invalidatePageGuidesCache(): void {
  cachedAssistantProfile = null;
  cachedGuides = {};
  lastFetchTime = 0;
}
