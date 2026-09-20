import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { MACRO_TEXT } from "@/lib/macroStyles";
import { cn } from "@/lib/cn";
import type { MacroDraft } from "@/features/brand-preferences/types";

const FIELDS: Array<{ key: keyof MacroDraft; label: string; shortLabel: string; unit: string; tone: string }> = [
  { key: "calories", label: "Calories", shortLabel: "Cal", unit: "kcal", tone: MACRO_TEXT.calories },
  { key: "protein", label: "Protein", shortLabel: "Protein", unit: "g", tone: MACRO_TEXT.protein },
  { key: "carbs", label: "Carbs", shortLabel: "Carbs", unit: "g", tone: MACRO_TEXT.carbs },
  { key: "fat", label: "Fat", shortLabel: "Fat", unit: "g", tone: MACRO_TEXT.fat },
];

interface MacroFieldGridProps {
  values: MacroDraft;
  onChange: (key: keyof MacroDraft, value: string) => void;
  /** Tighter labels and inputs for use inside a list row. */
  compact?: boolean;
}

/** Four per-100g number inputs: calories, protein, carbs, fat. */
export function MacroFieldGrid({ values, onChange, compact }: MacroFieldGridProps) {
  return (
    <div className={cn("grid grid-cols-4", compact ? "gap-1.5" : "gap-2")}>
      {FIELDS.map(({ key, label, shortLabel, unit, tone }) => (
        <FormField
          key={key}
          variant={compact ? "micro" : "caps"}
          labelClassName={tone}
          label={
            compact ? (
              shortLabel
            ) : (
              <>
                {label}
                <span className="font-normal normal-case text-slate-600"> /{unit}</span>
              </>
            )
          }
        >
          <Input
            type="number"
            step="0.1"
            min="0"
            size={compact ? "xs" : "sm"}
            surface="raised"
            className="text-center font-mono"
            value={values[key]}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </FormField>
      ))}
    </div>
  );
}
