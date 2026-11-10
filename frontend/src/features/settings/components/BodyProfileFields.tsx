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
    <div className="space-y-5">
      {/* Not a <FormField>: a wrapping <label> would forward caption clicks to the first tab. */}
      <div>
        <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-ink-muted">Sex</p>
        <SegmentedTabs<Sex | ""> tabs={SEX_TABS} value={body.sex} onChange={(sex) => onChange("sex", sex)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Age (yr)">
          <Input
            type="number"
            inputMode="numeric"
            min={BODY_LIMITS.age.min}
            max={BODY_LIMITS.age.max}
            value={body.age}
            onChange={(e) => onChange("age", e.target.value)}
          />
        </FormField>
        <FormField label="Height (cm)">
          <Input
            type="number"
            inputMode="decimal"
            min={BODY_LIMITS.height_cm.min}
            max={BODY_LIMITS.height_cm.max}
            value={body.height_cm}
            onChange={(e) => onChange("height_cm", e.target.value)}
          />
        </FormField>
        <FormField label="Weight (kg)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={BODY_LIMITS.weight_kg.min}
            max={BODY_LIMITS.weight_kg.max}
            value={body.weight_kg}
            onChange={(e) => onChange("weight_kg", e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Activity level" hint={hintFor(ACTIVITY_OPTIONS, body.activity_level)}>
        <Select value={body.activity_level} onChange={(e) => onChange("activity_level", e.target.value as ActivityLevel | "")}>
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

      <FormField label="Goal" hint={hintFor(GOAL_OPTIONS, body.goal)}>
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
        variant="outline"
        size="lg"
        fullWidth
        className="border-2 shadow-hard press-3d press-depth-4"
        icon={<Calculator className="text-primary" />}
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
