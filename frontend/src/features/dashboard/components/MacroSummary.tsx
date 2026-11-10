import Link from "next/link";
import { ArrowRight, Beef, Droplet, Flame, Info, Wheat, type LucideIcon } from "lucide-react";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { cn } from "@/lib/cn";
import { percentOf } from "@/lib/nutrition";
import type { Macros } from "@/types/nutrition";
import type { TargetKey, UserProfile } from "@/features/settings/types";

interface MacroCardConfig {
  key: keyof Macros;
  label: string;
  unit: "kcal" | "g";
  targetKey: TargetKey;
  icon: LucideIcon;
  /** Protein is the number most users chase, so its card is emphasised. */
  hero?: boolean;
}

const CARDS: MacroCardConfig[] = [
  { key: "calories", label: "Calories", unit: "kcal", targetKey: "target_calories", icon: Flame },
  { key: "protein", label: "Protein", unit: "g", targetKey: "target_protein", icon: Beef, hero: true },
  { key: "carbs", label: "Carbs", unit: "g", targetKey: "target_carbs", icon: Wheat },
  { key: "fat", label: "Fat", unit: "g", targetKey: "target_fat", icon: Droplet },
];

const formatAmount = (value: number, unit: "kcal" | "g") => (unit === "g" ? `${value}g` : `${value} kcal`);

function MacroCard({ config, consumed, target }: { config: MacroCardConfig; consumed: number; target: number }) {
  const { label, unit, icon: Icon, hero } = config;
  const percent = percentOf(consumed, target);
  const remaining = Math.round(target - consumed);
  const over = remaining < 0;

  return (
    <div
      className={cn(
        "flex min-h-48 flex-col bg-card p-5",
        hero ? "border-2 border-primary shadow-hard-primary" : "border border-line",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-sm font-medium uppercase tracking-widest",
            hero ? "text-primary" : "text-ink-muted",
          )}
        >
          {label}
        </span>
        <Icon className={cn("size-4", hero ? "text-primary" : "text-ink-subtle")} />
      </div>

      <p className={cn("mt-3 font-mono text-lg", hero ? "text-primary" : "text-ink-muted")}>
        <span className={cn("font-display text-3xl font-bold", hero ? "text-primary" : "text-ink")}>
          {Math.round(consumed).toLocaleString()}
        </span>{" "}
        / {target.toLocaleString()} {unit}
      </p>
      <p className={cn("mt-1 mb-5 font-mono text-xs", over ? "text-danger" : "text-ink-muted")}>
        {over ? `${formatAmount(-remaining, unit)} over target` : `${formatAmount(remaining, unit)} remaining`}
      </p>

      <ProgressBar
        label={label}
        percent={percent}
        className="mt-auto"
        fillClassName={over ? "bg-danger" : hero ? "bg-primary" : "bg-ink"}
      />
      <div className="mt-2 flex justify-between font-mono text-[11px] uppercase tracking-wide">
        <span className={cn("font-medium", hero ? "text-primary" : "text-ink")}>{percent}% reached</span>
        <span className="text-ink-muted">Target {target.toLocaleString()}</span>
      </div>
    </div>
  );
}

interface MacroSummaryProps {
  totals: Macros;
  profile: UserProfile;
}

/** Consumed vs. target for calories and each macro, plus how calories are derived. */
export function MacroSummary({ totals, profile }: MacroSummaryProps) {
  return (
    <section aria-labelledby="macro-summary-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="macro-summary-title" className="font-mono text-sm uppercase tracking-widest text-ink">
          {"// "}01 — Daily macro targets <span className="text-ink-subtle">· Consumed vs target</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((config) => (
          <MacroCard key={config.key} config={config} consumed={totals[config.key]} target={profile[config.targetKey]} />
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 border border-line bg-surface-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-mono text-xs text-ink-muted">
          <Info className="size-4 shrink-0" />
          Calories = 4 × protein + 4 × carbs + 9 × fat (Atwater factors)
        </p>
        <Link
          href="/settings"
          className="flex items-center gap-1 font-mono text-xs font-medium text-primary underline underline-offset-4"
        >
          Adjust macro targets <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
