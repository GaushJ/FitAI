import { Calculator } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";
import { SegmentedTabs } from "@/components/molecules/SegmentedTabs";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, SEX_TABS } from "@/features/settings/options";
import { BODY_LIMITS, type BodyDraft } from "@/features/settings/bodyProfile";
import type { ActivityLevel, Goal, Sex } from "@/features/settings/types";

interface BodyProfileFieldsProps {
  body: BodyDraft;
  onChange: <K extends keyof BodyDraft>(key: K, value: BodyDraft[K]) => void;
  canCalculate: boolean;
  calculating: boolean;
  onCalculate: () => void;
}

const hintFor = <T extends string>(options: Array<{ value: T; hint: string }>, value: T | "") =>
  options.find((o) => o.value === value)?.hint;

export function BodyProfileFields({ body, onChange, canCalculate, calculating, onCalculate }: BodyProfileFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Not a <FormField>: a wrapping <label> would forward caption clicks to the first tab. */}
      <div>
        <p className="mb-1.5 text-xs font-semibold text-slate-300">Sex</p>
        <SegmentedTabs<Sex | ""> tabs={SEX_TABS} value={body.sex} onChange={(sex) => onChange("sex", sex)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Age (years)" variant="plain">
          <Input
            type="number"
            size="lg"
            inputMode="numeric"
            min={BODY_LIMITS.age.min}
            max={BODY_LIMITS.age.max}
            value={body.age}
            onChange={(e) => onChange("age", e.target.value)}
          />
        </FormField>
        <FormField label="Height (cm)" variant="plain">
          <Input
            type="number"
            size="lg"
            inputMode="decimal"
            min={BODY_LIMITS.height_cm.min}
            max={BODY_LIMITS.height_cm.max}
            value={body.height_cm}
            onChange={(e) => onChange("height_cm", e.target.value)}
          />
        </FormField>
        <FormField label="Weight (kg)" variant="plain">
          <Input
            type="number"
            size="lg"
            inputMode="decimal"
            step="0.1"
            min={BODY_LIMITS.weight_kg.min}
            max={BODY_LIMITS.weight_kg.max}
            value={body.weight_kg}
            onChange={(e) => onChange("weight_kg", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Activity level" variant="plain" hint={hintFor(ACTIVITY_OPTIONS, body.activity_level)}>
        <Select
          value={body.activity_level}
          onChange={(e) => onChange("activity_level", e.target.value as ActivityLevel | "")}
        >
          <option value="" disabled>
            Choose activity level…
          </option>
          {ACTIVITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Goal" variant="plain" hint={hintFor(GOAL_OPTIONS, body.goal)}>
        <Select value={body.goal} onChange={(e) => onChange("goal", e.target.value as Goal | "")}>
          <option value="" disabled>
            Choose a goal…
          </option>
          {GOAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      <Button
        variant="secondary"
        fullWidth
        icon={<Calculator className="text-accent" />}
        loading={calculating}
        loadingText="Calculating..."
        disabled={!canCalculate}
        onClick={onCalculate}
      >
        Calculate my targets
      </Button>
    </div>
  );
}
