'use client';

import HeroSection from "@/components/HeroSection";
import FeatureSection from '@/components/FeatureSection';
import GameCarousel from '@/components/GameCarousel';
import LetsPlaySection from '@/components/LetsPlaySection';
import PlatformIntelligenceSection from '@/components/PlatformIntelligenceSection';
import EcosystemLogosSection from '@/components/EcosystemLogosSection';
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
      <EcosystemLogosSection />
      <AdvisoryPartnershipsSection />
      <UpcomingTournaments />
      <TestimonialsSection />
      <NewsUpdates />
      <LetsPlaySection />
    </div>
  );
}
