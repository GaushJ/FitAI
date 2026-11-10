import { LandingSection } from "@/features/landing/components/LandingSection";
import { BRAND_METHODS, SAMPLE_BRANDS } from "@/features/landing/content";

export function BrandPreferencesSection() {
  return (
    <LandingSection id="brands" index="02" title="Brand preferences & 3 input methods">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="border border-line bg-card p-6 sm:p-8">
          <span className="bg-ink px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-white">
            Exact nutrition control
          </span>
          <h3 className="mt-4 font-display text-3xl font-bold uppercase leading-tight text-ink sm:text-4xl">
            Custom brand preferences
          </h3>
          <p className="mt-3 text-ink-muted">
            Generic databases often use averages that don&apos;t match what you buy. Save the brands you actually eat
            with per-100g or per-100ml values — when you log &quot;milk&quot; or &quot;paneer&quot;, your brand is used
            automatically.
          </p>
          <ol className="mt-6 space-y-3">
            {BRAND_METHODS.map(({ title, description, icon: Icon }, index) => (
              <li key={title} className="border border-line bg-surface-low p-4">
                <p className="flex items-center gap-2 font-display text-base font-semibold uppercase text-ink">
                  <Icon className="size-4 text-primary" /> {index + 1}. {title}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{description}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="border border-ink bg-surface-container p-6 shadow-hard sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-semibold uppercase text-ink">Saved brand library</h3>
              <p className="font-mono text-xs text-ink-muted">Applied automatically when logging meals</p>
            </div>
            <span className="border border-line bg-card px-2 py-1 font-mono text-[11px] text-ink">Excel sync ready</span>
          </div>

          <ul className="mt-5 space-y-3">
            {SAMPLE_BRANDS.map((brand) => (
              <li key={brand.name} className="border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-semibold uppercase text-ink">{brand.name}</p>
                    <p className="font-mono text-[11px] text-ink-muted">Keyword trigger: &quot;{brand.trigger}&quot;</p>
                  </div>
                  <span className="border border-line bg-surface-low px-2 py-0.5 font-mono text-[11px] text-ink">
                    {brand.kcal}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
                  {(
                    [
                      ["Protein", brand.p],
                      ["Carbs", brand.c],
                      ["Fat", brand.f],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="inline text-ink-muted">{label}: </dt>
                      <dd className="inline font-medium text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          <p className="mt-5 flex justify-between border-t border-line pt-3 font-mono text-[11px] text-ink-muted">
            Actions: Download .xlsx · Import .xlsx <span className="text-ink">Synced to your account</span>
          </p>
        </article>
      </div>
    </LandingSection>
  );
}
