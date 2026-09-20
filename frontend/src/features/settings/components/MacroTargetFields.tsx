import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { KCAL_PER_GRAM } from "@/lib/nutrition";
import type { MacroKey, TargetsDraft } from "@/features/settings/hooks/useMacroTargetsForm";

const MACROS: Array<{ key: MacroKey; label: string }> = [
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
];

interface MacroTargetFieldsProps {
  targets: TargetsDraft;
  onMacroChange: (key: MacroKey, value: string) => void;
  onCaloriesChange: (value: string) => void;
  onCaloriesCommit: () => void;
}

export function MacroTargetFields({ targets, onMacroChange, onCaloriesChange, onCaloriesCommit }: MacroTargetFieldsProps) {
  return (
    <div className="space-y-3">
      <FormField label="Calories Goal (kcal)" variant="plain">
        <Input
          type="number"
          required
          min={1}
          size="lg"
          value={targets.calories}
          onChange={(e) => onCaloriesChange(e.target.value)}
          onBlur={onCaloriesCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCaloriesCommit();
          }}
        />
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        {MACROS.map(({ key, label }) => (
          <FormField
            key={key}
            label={label}
            variant="plain"
            hint={`≈ ${Math.round((Number(targets[key]) || 0) * KCAL_PER_GRAM[key])} kcal`}
          >
            <Input
              type="number"
              required
              min={0}
              size="lg"
              value={targets[key]}
              onChange={(e) => onMacroChange(key, e.target.value)}
            />
          </FormField>
        ))}
      </div>

      <p className="text-[10px] leading-relaxed text-slate-500">
        Calories = 4 × protein + 4 × carbs + 9 × fat (Atwater factors). Editing a macro updates calories;
        editing calories rescales your macros, keeping their proportions.
      </p>
    </div>
  );
}
