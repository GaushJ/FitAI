import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { buttonClasses } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";
import { LandingSection } from "@/features/landing/components/LandingSection";
import { PRICING_POINTS, PRO_FEATURES, PRO_PRICE } from "@/features/landing/content";

export function PricingSection() {
  return (
    <LandingSection id="pricing" index="05" title="Pricing">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[2fr_3fr]">
        <div>
          <h3 className="font-display text-4xl font-bold uppercase leading-tight text-ink sm:text-5xl">
            No subscriptions. One simple payment.
          </h3>
          <p className="mt-4 text-ink-muted">
            No recurring monthly charges. Pay once via Razorpay to unlock GetFitBro Pro, and track your daily intake
            without worrying about renewals.
          </p>
          <ul className="mt-5 space-y-1.5 font-mono text-sm text-ink">
            {PRICING_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <Check className="size-4 text-primary" /> {point}
              </li>
            ))}
          </ul>
        </div>

        <article className="border-2 border-ink bg-card p-6 shadow-hard sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-5">
            <div>
              <span className="bg-primary px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-white">Pro unlock</span>
              <p className="mt-3 font-display text-3xl font-bold uppercase text-ink sm:text-4xl">GetFitBro Pro</p>
            </div>
            <div className="text-right">
              <p className="font-display text-5xl font-bold text-ink">{PRO_PRICE}</p>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">One-time payment</p>
            </div>
          </div>
          <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-ink sm:grid-cols-2">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {feature}
              </li>
            ))}
          </ul>
          <Link href="/login" className={cn(buttonClasses({ size: "lg", fullWidth: true }), "mt-6 text-lg")}>
            <Zap className="size-5" /> Unlock GetFitBro Pro — {PRO_PRICE}
          </Link>
          <p className="mt-3 text-center font-mono text-[11px] text-ink-muted">Secure checkout processed via Razorpay</p>
        </article>
      </div>
    </LandingSection>
  );
}
