'use client';

import { AuroraBackground } from '@/components/aurora-background';
import { ParticleField } from '@/components/particle-field';
import { Navbar } from '@/components/navbar';
import { HeroSection } from '@/components/hero-section';
import { GeneratorSection } from '@/components/generator-section';
import { GallerySection } from '@/components/gallery-section';
import { DashboardSection } from '@/components/dashboard-section';
import { TrendingSection } from '@/components/trending-section';
import { CommunitySection } from '@/components/community-section';
import { PromptHistory } from '@/components/prompt-history';
import { PricingSection } from '@/components/pricing-section';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <AuroraBackground />
      <ParticleField />

      {/* Navigation */}
      <Navbar />

      {/* Main content */}
      <main className="relative z-10 flex-1">
        <HeroSection />
        <GeneratorSection />
        <GallerySection />
        <DashboardSection />
        <TrendingSection />
        <CommunitySection />
        <PromptHistory />
        <PricingSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
