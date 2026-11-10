import { cn } from "@/lib/cn";
import { MACRO_TEXT } from "@/lib/macroStyles";
import type { MacroDraft } from "@/features/brand-preferences/types";

const FIELDS: Array<{ key: keyof MacroDraft; label: string; code: string; unit: string; tone: string }> = [
  { key: "calories", label: "Energy", code: "Cal", unit: "kcal", tone: MACRO_TEXT.calories },
  { key: "protein", label: "Protein", code: "P", unit: "g", tone: MACRO_TEXT.protein },
  { key: "carbs", label: "Carbohydrates", code: "C", unit: "g", tone: MACRO_TEXT.carbs },
  { key: "fat", label: "Total fat", code: "F", unit: "g", tone: MACRO_TEXT.fat },
];

interface MacroFieldGridProps {
  values: MacroDraft;
  onChange: (key: keyof MacroDraft, value: string) => void;
  /** Smaller numbers for use inside a list row. */
  compact?: boolean;
}

/** Four per-100g number tiles: energy, protein, carbs, fat. */
export function MacroFieldGrid({ values, onChange, compact }: MacroFieldGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {FIELDS.map(({ key, label, code, unit, tone }) => (
        <label
          key={key}
          className="block border border-line bg-card px-3 py-2.5 transition focus-within:border-ink"
        >
          <span className="flex justify-between font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            {label}
            <span className={cn("font-medium", tone)}>{code}</span>
          </span>
          <span className="mt-1 flex items-baseline gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={values[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className={cn(
                "w-full min-w-0 bg-transparent font-display font-bold text-ink focus:outline-none",
                compact ? "text-xl" : "text-3xl",
              )}
            />
            <span className="font-mono text-xs text-ink-muted">{unit}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
