import { CtaSection } from "@/features/landing/components/CtaSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { LandingNav } from "@/features/landing/components/LandingNav";
import { ResolutionSection } from "@/features/landing/components/ResolutionSection";
import { StatsSection } from "@/features/landing/components/StatsSection";
import { StreakSection } from "@/features/landing/components/StreakSection";
import { TestimonialSection } from "@/features/landing/components/TestimonialSection";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-slate-100">
      <LandingNav />
      <HeroSection />
      <HowItWorksSection />
      <ResolutionSection />
      <StreakSection />
      <StatsSection />
      <TestimonialSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
