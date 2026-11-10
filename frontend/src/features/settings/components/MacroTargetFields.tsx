import { Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { KCAL_PER_GRAM } from "@/lib/nutrition";
import type { MacroKey, TargetsDraft } from "@/features/settings/hooks/useMacroTargetsForm";

const MACROS: Array<{ key: MacroKey; label: string; bar: string }> = [
  { key: "protein", label: "Protein", bar: "bg-primary" },
  { key: "carbs", label: "Carbohydrates", bar: "bg-ink" },
  { key: "fat", label: "Dietary fat", bar: "bg-line-strong" },
];

const kcalFor = (targets: TargetsDraft, key: MacroKey) => (Number(targets[key]) || 0) * KCAL_PER_GRAM[key];

interface MacroTargetFieldsProps {
  targets: TargetsDraft;
  onMacroChange: (key: MacroKey, value: string) => void;
  onCaloriesChange: (value: string) => void;
  onCaloriesCommit: () => void;
}

/** Daily calorie target with its macro split, every number editable. */
export function MacroTargetFields({ targets, onMacroChange, onCaloriesChange, onCaloriesCommit }: MacroTargetFieldsProps) {
  const macroKcal = MACROS.reduce((sum, { key }) => sum + kcalFor(targets, key), 0);
  const share = (key: MacroKey) => (macroKcal > 0 ? (kcalFor(targets, key) / macroKcal) * 100 : 0);

  return (
    <div className="space-y-4">
      <div className="border border-line bg-surface-low p-5">
        <label htmlFor="target-calories" className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          Daily calorie target
        </label>
        <div className="mt-1 flex items-baseline gap-2">
          <input
            id="target-calories"
            type="number"
            required
            min={1}
            value={targets.calories}
            onChange={(e) => onCaloriesChange(e.target.value)}
            onBlur={onCaloriesCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCaloriesCommit();
            }}
            className="field-sizing-content min-w-[3ch] max-w-full border-b-2 border-transparent bg-transparent font-display text-6xl font-bold text-ink focus:border-ink focus:outline-none"
          />
          <span className="font-mono text-sm uppercase text-primary">kcal / day</span>
        </div>

        <div className="mt-4 flex h-2.5 w-full overflow-hidden bg-surface-highest" aria-hidden>
          {MACROS.map(({ key, bar }) => (
            <div key={key} className={cn("h-full transition-all", bar)} style={{ width: `${share(key)}%` }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase text-ink-muted">
          {MACROS.map(({ key, label, bar }) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className={cn("size-2.5", bar)} />
              {label} ({share(key).toFixed(1)}%)
            </span>
          ))}
        </div>
      </div>

      {MACROS.map(({ key, label }, index) => (
        <label
          key={key}
          className="flex items-center gap-4 border border-line bg-card p-4 transition focus-within:border-ink"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold uppercase text-ink">
              <span className="mr-1.5 font-mono text-xs text-primary">{"// "}0{index + 1}</span>
              {label}
            </span>
            <span className="font-mono text-xs text-ink-muted">≈ {Math.round(kcalFor(targets, key))} kcal</span>
          </span>
          <span className="flex items-baseline gap-1 border border-line bg-surface-low px-3 py-2">
            <input
              type="number"
              required
              min={0}
              value={targets[key]}
              onChange={(e) => onMacroChange(key, e.target.value)}
              aria-label={`${label} grams`}
              className="w-16 bg-transparent text-right font-display text-2xl font-bold text-ink focus:outline-none"
            />
            <span className="font-mono text-xs text-ink-muted">g</span>
          </span>
          <span className="hidden w-14 text-right font-mono text-sm text-ink-muted sm:block">{share(key).toFixed(1)}%</span>
        </label>
      ))}

      <div className="flex gap-3 border border-line bg-surface-low p-4 text-sm text-ink-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Calories = 4 × protein + 4 × carbs + 9 × fat. Editing a macro updates total calories; editing calories
          rescales your macros, keeping their proportions.
        </p>
      </div>
    </div>
  );
}
