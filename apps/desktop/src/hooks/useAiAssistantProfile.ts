import { useState, useEffect, useCallback, useRef } from 'react';
import defaultAvatarImg from '@/assets/ai-copilot-agent.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { getAiAssistantProfile, invalidatePageGuidesCache } from '@/services/page-guides';
import { useDataSync } from '@/lib/syncEvents';
import { DEFAULT_AI_ASSISTANT_PROFILE, type AiAssistantProfileDto } from '@smartfeed/shared';

export interface AiAssistantProfileState {
  profile: AiAssistantProfileDto;
  avatarUrl: string;
  name: string;
  roleUk: string;
  roleEn: string;
  badgeUk: string;
  badgeEn: string;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useAiAssistantProfile(): AiAssistantProfileState {
  const { token } = useAuth();
  const [profile, setProfile] = useState<AiAssistantProfileDto>(DEFAULT_AI_ASSISTANT_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedTokenRef = useRef<string | null>(null);

  const fetchProfile = useCallback(
    async (force = false) => {
      if (!force && lastFetchedTokenRef.current === (token || 'anon')) return;
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setIsLoading(true);
        const data = await getAiAssistantProfile(token || undefined);
        setProfile(data);
        lastFetchedTokenRef.current = token || 'anon';
      } catch (err) {
        console.warn(
          '[useAiAssistantProfile] Failed to fetch AI assistant profile, using default:',
          err,
        );
        setProfile(DEFAULT_AI_ASSISTANT_PROFILE);
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Synchronize strictly when AI assistant / page guide settings change (FE-13)
  useDataSync(['settings'], () => {
    invalidatePageGuidesCache();
    fetchProfile(true);
  });

  const avatarUrl = profile.avatarUrl || defaultAvatarImg;

  return {
    profile,
    avatarUrl,
    name: profile.name,
    roleUk: profile.roleUk,
    roleEn: profile.roleEn,
    badgeUk: profile.badgeUk,
    badgeEn: profile.badgeEn,
    isLoading,
    refresh: fetchProfile,
  };
}
