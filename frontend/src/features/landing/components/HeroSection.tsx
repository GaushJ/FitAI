import Link from "next/link";
import { CircleCheck, ClipboardList, Mic, Tags } from "lucide-react";
import { buttonClasses } from "@/components/atoms/Button";
import { cn } from "@/lib/cn";
import { HERO_PERKS, PREVIEW_MACROS, PREVIEW_PARSED } from "@/features/landing/content";

/** Static example of the dashboard's macro panel and a parsed meal. */
function TodaysMacrosPreview() {
  return (
    <div className="border border-ink bg-card p-5 shadow-hard sm:p-6" aria-label="Example of today's macros">
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
          <span className="bg-ink px-1.5 py-0.5 text-white">Today&apos;s macros</span>
          <span className="text-ink-muted">Calories &amp; targets</span>
        </p>
        <ClipboardList className="size-4 text-primary" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PREVIEW_MACROS.map((m) => (
          <div key={m.label} className="border border-line bg-surface-low p-3">
            <p className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              {m.label} <span>Goal: {m.goal}</span>
            </p>
            <p className="mt-1 font-mono text-xs text-ink-muted">
              <span className={cn("font-display text-2xl font-bold", m.label === "Protein" ? "text-primary" : "text-ink")}>
                {m.value}
              </span>{" "}
              {m.unit}
            </p>
            <div className="mt-2 h-1.5 bg-surface-highest">
              <div className={cn("h-full", m.bar)} style={{ width: `${m.percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border border-line p-3 font-mono text-xs">
        <p className="flex justify-between text-ink-muted">
          INPUT: &quot;200ml Nandini milk and 2 eggs&quot; <span className="text-primary">PARSED</span>
        </p>
        <ul className="mt-2 space-y-1 text-ink">
          {PREVIEW_PARSED.map((row) => (
            <li key={row.item} className="flex justify-between gap-3">
              <span>• {row.item}</span>
              <span className="shrink-0">{row.macros}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-line pt-2 text-ink">
          MEAL TOTAL: <span className="text-primary">260 kcal · 19.0g Protein · 9.4g Carbs · 13.0g Fat</span>
        </p>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
      <div>
        <p className="inline-flex items-center gap-2 border border-line bg-surface-low px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink">
          <Mic className="size-3.5 text-primary" /> Voice, text &amp; nutrition label logging
        </p>
        <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl xl:text-7xl">
          Type, speak, or scan.
          <br />
          <span className="text-primary underline decoration-4 underline-offset-8">Real macros</span> in seconds.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-muted">
          Type or speak what you ate — like{" "}
          <em className="font-mono text-base not-italic text-ink">&quot;200ml Nandini milk and 2 eggs&quot;</em> — or upload a
          photo of the nutrition label. GetFitBro parses each item, applies your saved brands, and calculates calories,
          protein, carbs and fat.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className={buttonClasses({ size: "lg" })}>
            <ClipboardList className="size-5" /> Try meal logging
          </Link>
          <a href="#brands" className={cn(buttonClasses({ variant: "outline", size: "lg" }), "border-2 shadow-hard-sm press-3d press-depth-2")}>
            <Tags className="size-5" /> Brand preferences
          </a>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 font-mono text-xs text-ink-muted">
          {HERO_PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-1.5">
              <CircleCheck className="size-3.5 text-primary" /> {perk}
            </li>
          ))}
        </ul>
      </div>

      <TodaysMacrosPreview />
    </section>
  );
}
