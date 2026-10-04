import React from 'react';
import { FEATURE_TEASER_REGISTRY } from '@/modules/feature-teaser/config/feature-teaser.registry';
import { FeatureHeroSection } from '@/modules/feature-teaser/components/FeatureHeroSection';
import { FeatureBenefitsGrid } from '@/modules/feature-teaser/components/FeatureBenefitsGrid';
import { FeatureRoiWidget } from '@/modules/feature-teaser/components/FeatureRoiWidget';
import { FeatureComparisonCard } from '@/modules/feature-teaser/components/FeatureComparisonCard';
import { FeatureStickyCtaBar } from '@/modules/feature-teaser/components/FeatureStickyCtaBar';
import { TeamInteractiveMockup } from '@/modules/feature-teaser/components/mockups/TeamInteractiveMockup';
import { CloudSyncInteractiveMockup } from '@/modules/feature-teaser/components/mockups/CloudSyncInteractiveMockup';
import { AiEnrichmentInteractiveMockup } from '@/modules/feature-teaser/components/mockups/AiEnrichmentInteractiveMockup';

interface FeatureTeaserViewProps {
  featureKey: string;
}

export const FeatureTeaserView: React.FC<FeatureTeaserViewProps> = ({ featureKey }) => {
  const config = FEATURE_TEASER_REGISTRY[featureKey] || FEATURE_TEASER_REGISTRY.team;

  return (
    <div
      data-testid="feature-teaser-page"
      className="relative flex flex-col min-h-full animate-in fade-in-50 duration-300"
    >
      <div className="max-w-4xl mx-auto w-full space-y-6 pb-24 p-4 md:p-6">
        {/* Hero Section */}
        <FeatureHeroSection config={config} />

        {/* Interactive Mockup / Sandbox */}
        {config.mockupType === 'team' && <TeamInteractiveMockup />}
        {config.mockupType === 'cloud_sync' && <CloudSyncInteractiveMockup />}
        {config.mockupType === 'ai_enrichment' && <AiEnrichmentInteractiveMockup />}

        {/* Value Benefits Grid */}
        <FeatureBenefitsGrid titleKey={config.benefitsTitleKey} benefits={config.benefits} />

        {/* ROI Calculator */}
        <FeatureRoiWidget roiConfig={config.roiConfig} featureKey={featureKey} />

        {/* Plan Comparison Card */}
        <FeatureComparisonCard config={config} />
      </div>

      {/* 100% Solid Sticky CTA Footer */}
      <FeatureStickyCtaBar config={config} />
    </div>
  );
};
