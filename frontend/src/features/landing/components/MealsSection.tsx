import { Bookmark, RefreshCcw } from "lucide-react";
import { LandingSection } from "@/features/landing/components/LandingSection";

export function MealsSection() {
  return (
    <LandingSection id="meals" index="03" title="Frequent & saved meals">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article className="border border-line bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold uppercase text-ink">
            <RefreshCcw className="size-5 text-primary" /> Auto-detected frequent meals
          </h3>
          <p className="mt-2 text-sm text-ink-muted">
            Any meal you log two or more times shows up in Frequent Meals. Re-log your usual breakfast or post-workout
            shake with one tap, or adjust the portions first.
          </p>
          <div className="mt-5 flex items-center justify-between gap-3 bg-surface-container px-3 py-2.5 font-mono text-xs text-ink">
            &quot;Whey shake + 200ml milk&quot; (logged 8 times)
            <span className="shrink-0 bg-ink px-2 py-1 text-[10px] uppercase text-white">1-tap re-log</span>
          </div>
        </article>

        <article className="border border-line bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-xl font-semibold uppercase text-ink">
            <Bookmark className="size-5 text-primary" /> Custom saved meal templates
          </h3>
          <p className="mt-2 text-sm text-ink-muted">
            Save recipes or combinations you make often under a name. Instead of listing every component each morning,
            log the whole template in one go.
          </p>
          <div className="mt-5 flex items-center justify-between gap-3 bg-surface-container px-3 py-2.5 font-mono text-xs text-ink">
            Template: &quot;Standard high-protein breakfast&quot;
            <span className="shrink-0 border border-line bg-card px-2 py-1 text-[10px] uppercase">420 kcal | 38g P</span>
          </div>
        </article>
      </div>
    </LandingSection>
  );
}
