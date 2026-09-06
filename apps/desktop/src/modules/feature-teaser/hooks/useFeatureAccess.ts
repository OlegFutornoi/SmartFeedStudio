import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PlanType } from '@smartfeed/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/hooks/useLicense';
import { FEATURE_TEASER_REGISTRY, PLAN_LEVEL } from '../config/feature-teaser.registry';
import type { FeatureAccessResult } from '../types/feature-teaser.types';

export function useFeatureAccess(featureKey: string): FeatureAccessResult {
  const { user } = useAuth();
  const { license } = useLicense();
  const location = useLocation();

  return useMemo(() => {
    const config = FEATURE_TEASER_REGISTRY[featureKey];
    const currentPlan: PlanType = (license?.planType as PlanType) || PlanType.STARTER;
    const minPlan: PlanType = config?.minPlan || PlanType.PRO;

    // Optional query parameter to force preview (useful for marketing demos or admin reviews)
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('preview') === 'teaser') {
      return {
        isLocked: true,
        isAllowed: false,
        reason: 'PREVIEW_FORCED',
        currentPlan,
        minPlan,
        config,
      };
    }

    // Elevated admins always have direct access
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    if (isAdmin) {
      return {
        isLocked: false,
        isAllowed: true,
        reason: 'ADMIN',
        currentPlan,
        minPlan,
        config,
      };
    }

    if (!config) {
      return {
        isLocked: false,
        isAllowed: true,
        reason: 'ALLOWED',
        currentPlan,
        minPlan,
        config: undefined,
      };
    }

    const currentLevel = PLAN_LEVEL[currentPlan] ?? 1;
    const requiredLevel = PLAN_LEVEL[minPlan] ?? 3;

    // Specific domain check for 'team':
    // If the user already has an established organization workspace (e.g. Rozetka LLC), keep access open.
    // If the user has no organization workspace and is on Starter, team feature is locked (teaser shown).
    if (featureKey === 'team') {
      const hasOrg = Boolean(user?.organization?.id);
      if (hasOrg) {
        return {
          isLocked: false,
          isAllowed: true,
          reason: 'HAS_ORGANIZATION',
          currentPlan,
          minPlan,
          config,
        };
      }

      if (currentLevel < requiredLevel) {
        return {
          isLocked: true,
          isAllowed: false,
          reason: 'PLAN_LEVEL_INSUFFICIENT',
          currentPlan,
          minPlan,
          config,
        };
      }
    }

    // Specific domain check for 'cloud_sync':
    if (featureKey === 'cloud_sync') {
      const canCloud = Boolean(license?.canCloudBackup);
      if (!canCloud || currentLevel < requiredLevel) {
        return {
          isLocked: true,
          isAllowed: false,
          reason: 'NO_CLOUD_BACKUP',
          currentPlan,
          minPlan,
          config,
        };
      }
    }

    // Specific domain check for 'ai_enrichment':
    if (featureKey === 'ai_enrichment') {
      if (currentLevel < requiredLevel) {
        return {
          isLocked: true,
          isAllowed: false,
          reason: 'PLAN_LEVEL_INSUFFICIENT',
          currentPlan,
          minPlan,
          config,
        };
      }
    }

    // Generic plan level comparison
    if (currentLevel < requiredLevel) {
      return {
        isLocked: true,
        isAllowed: false,
        reason: 'PLAN_LEVEL_INSUFFICIENT',
        currentPlan,
        minPlan,
        config,
      };
    }

    return {
      isLocked: false,
      isAllowed: true,
      reason: 'ALLOWED',
      currentPlan,
      minPlan,
      config,
    };
  }, [user, license, featureKey, location.search]);
}
