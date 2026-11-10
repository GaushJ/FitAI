import { cn } from "@/lib/cn";
import { LandingSection } from "@/features/landing/components/LandingSection";
import { SAMPLE_BODY_STATS, SAMPLE_HEAT_BARS, SAMPLE_STREAK_STATS } from "@/features/landing/content";

function CardTag({ children }: { children: string }) {
  return <span className="bg-ink px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-white">{children}</span>;
}

export function TargetsSection() {
  return (
    <LandingSection id="targets" index="04" title="Daily targets & Mifflin–St Jeor calculator">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="border border-line bg-card p-6">
          <CardTag>Body stats profile</CardTag>
          <h3 className="mt-4 font-display text-xl font-semibold uppercase text-ink">Calculate macro targets</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your stats and GetFitBro applies the Mifflin–St Jeor formula to estimate your BMR, then adjusts for
            activity level and goal.
          </p>
          <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SAMPLE_BODY_STATS.map((stat) => (
              <div key={stat.label} className="border border-line bg-surface-low p-3">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{stat.label}</dt>
                <dd className={cn("mt-1 font-mono text-sm font-medium", stat.accent ? "text-primary" : "text-ink")}>
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-line pt-3 font-mono text-xs text-ink-muted">
            You can also edit daily calories, protein, carbs or fat by hand at any time.
          </p>
        </article>

        <article className="border border-line bg-card p-6">
          <CardTag>Activity history</CardTag>
          <h3 className="mt-4 font-display text-xl font-semibold uppercase text-ink">Streaks, 90-day heatmap &amp; history</h3>
          <p className="mt-1 text-sm text-ink-muted">See how consistently you log, without gamified noise.</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SAMPLE_STREAK_STATS.map((stat) => (
              <div key={stat.label} className="border border-line bg-surface-low p-3 text-center">
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{stat.label}</dt>
                <dd className={cn("font-display text-3xl font-bold", stat.accent ? "text-primary" : "text-ink")}>
                  {stat.value}
                </dd>
                <dd className="font-mono text-[10px] text-ink-muted">{stat.unit}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 border border-line p-3" aria-hidden>
            <p className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              90-day activity heatmap <span className="text-primary">Recent weeks</span>
            </p>
            <div className="mt-3 flex h-16 items-end gap-1">
              {SAMPLE_HEAT_BARS.map((bar, i) => (
                <div key={i} className={cn("flex-1", bar.tone)} style={{ height: `${bar.height}%` }} />
              ))}
            </div>
            <p className="mt-2 flex justify-between font-mono text-[10px] text-ink-muted">
              <span>Weekly calorie charts</span>
              <span>Paginated meal logs</span>
            </p>
          </div>
        </article>
      </div>
    </LandingSection>
  );
}
