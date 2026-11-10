import { BrandPreferencesSection } from "@/features/landing/components/BrandPreferencesSection";
import { ByokSection } from "@/features/landing/components/ByokSection";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { HowItWorksSection } from "@/features/landing/components/HowItWorksSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { LandingNav } from "@/features/landing/components/LandingNav";
import { MealsSection } from "@/features/landing/components/MealsSection";
import { PricingSection } from "@/features/landing/components/PricingSection";
import { TargetsSection } from "@/features/landing/components/TargetsSection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      <LandingNav />
      <main className="mx-auto max-w-7xl px-4 sm:px-8">
        <HeroSection />
        <HowItWorksSection />
        <BrandPreferencesSection />
        <MealsSection />
        <TargetsSection />
        <ByokSection />
        <PricingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
