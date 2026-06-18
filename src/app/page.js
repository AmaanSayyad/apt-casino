'use client';

import HeroSection from "@/components/HeroSection";
import FeatureSection from '@/components/FeatureSection';
import GameCarousel from '@/components/GameCarousel';
import LetsPlaySection from '@/components/LetsPlaySection';
import PlatformIntelligenceSection from '@/components/PlatformIntelligenceSection';
import TokenomicsSection from '@/components/TokenomicsSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import EcosystemLogosSection from '@/components/EcosystemLogosSection';
import DexscreenerEmbedSection from '@/components/DexscreenerEmbedSection';
import AdvisoryPartnershipsSection from '@/components/AdvisoryPartnershipsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import UpcomingTournaments from '@/components/UpcomingTournaments';
import NewsUpdates from '@/components/NewsUpdates';
import ProvablyFairSection from '@/components/ProvablyFairSection';
export default function Home() {
  return (
    <div className="bg-[#070005] overflow-x-hidden w-full">
      <HeroSection />
      <FeatureSection />
      <GameCarousel />
      <PlatformIntelligenceSection />
      <ProvablyFairSection />
      <HowItWorksSection />
      <EcosystemLogosSection />
      <DexscreenerEmbedSection />
      <TokenomicsSection />
      <AdvisoryPartnershipsSection />
      <UpcomingTournaments />
      <TestimonialsSection />
      <NewsUpdates />
      <LetsPlaySection />
    </div>
  );
}
