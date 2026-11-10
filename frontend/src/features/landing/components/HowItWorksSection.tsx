import { LandingSection } from "@/features/landing/components/LandingSection";
import { LOGGING_STEPS } from "@/features/landing/content";

export function HowItWorksSection() {
  return (
    <LandingSection id="logging" index="01" title="How logging works">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {LOGGING_STEPS.map(({ title, description, example, icon: Icon }, index) => (
          <article key={title} className="flex flex-col border border-line bg-card p-6 transition hover:border-ink">
            <div className="flex items-start justify-between">
              <span className="font-display text-3xl font-bold text-surface-highest">0{index + 1}</span>
              <Icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold uppercase text-ink">{title}</h3>
            <p className="mt-2 flex-1 text-sm text-ink-muted">{description}</p>
            <p className="mt-5 bg-surface-container px-3 py-2.5 font-mono text-xs text-ink">{example}</p>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
