import { ArrowRight, Check } from "lucide-react";
import { HERO_PERKS } from "@/features/landing/content";
import { IngredientMarquee } from "@/features/landing/components/IngredientMarquee";
import { LandingLink } from "@/features/landing/components/LandingLink";
import { MealPreviewCard } from "@/features/landing/components/MealPreviewCard";

export function HeroSection() {
  return (
    <section className="relative mx-auto max-w-[1240px] px-8 pt-[148px] pb-20 max-[640px]:px-5 max-[640px]:pt-32 max-[640px]:pb-14">
      <div className="pointer-events-none absolute top-[60px] left-1/2 h-[520px] w-[780px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(201,242,77,0.10),transparent_70%)] blur-[20px]" />

      <div className="relative grid grid-cols-[1.05fr_0.95fr] items-center gap-14 max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div>
          <div className="mb-7 inline-flex animate-fv-up items-center gap-2 rounded-full border border-accent/[0.28] bg-accent/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.02em] text-accent [animation-delay:0.05s]">
            <span className="inline-block size-[7px] rounded-full bg-accent" />
            AI-powered macro tracking
          </div>

          <h1 className="mb-6 animate-fv-up font-display text-[clamp(48px,6vw,74px)] leading-[0.96] font-extrabold tracking-[-0.03em] [animation-delay:0.05s]">
            Know
            <br />
            exactly
            <br />
            what you <span className="text-accent">ate.</span>
          </h1>

          <p className="mb-9 max-w-[440px] animate-fv-up text-[19px] leading-[1.55] text-slate-400 [animation-delay:0.18s]">
            Type or say what you ate and AI resolves the exact macros — by brand, portion and prep. No
            searching food databases. No weighing in your head.
          </p>

          <div className="mb-[30px] flex animate-fv-up flex-wrap items-center gap-3.5 [animation-delay:0.3s]">
            <LandingLink href="/login" variant="primary">
              Start tracking free <ArrowRight size={18} strokeWidth={2.5} />
            </LandingLink>
            <LandingLink href="#how" variant="ghost">
              See how it works
            </LandingLink>
          </div>

          <div className="flex animate-fv-up items-center gap-[18px] text-[13px] font-medium text-slate-600 [animation-delay:0.42s]">
            {HERO_PERKS.map((perk) => (
              <span key={perk} className="inline-flex items-center gap-1.5">
                <Check size={14} strokeWidth={3} className="text-accent" />
                {perk}
              </span>
            ))}
          </div>
        </div>

        <MealPreviewCard />
      </div>

      <IngredientMarquee />
    </section>
  );
}
