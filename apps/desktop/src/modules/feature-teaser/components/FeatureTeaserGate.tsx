import React from 'react';
import { useFeatureAccess } from '@/modules/feature-teaser/hooks/useFeatureAccess';
import { FeatureTeaserView } from './FeatureTeaserView';

interface FeatureTeaserGateProps {
  featureKey: string;
  children: React.ReactNode;
}

/**
 * FeatureTeaserGate protects routes and views.
 * If the current user has access, it transparently renders `children`.
 * If the user does NOT have access (e.g. Starter tier for Team), it renders
 * the autonomous FeatureTeaserView showcasing the value of upgrading.
 */
export const FeatureTeaserGate: React.FC<FeatureTeaserGateProps> = ({ featureKey, children }) => {
  const access = useFeatureAccess(featureKey);

  if (access.isLocked) {
    return <FeatureTeaserView featureKey={featureKey} />;
  }

  return <>{children}</>;
};
