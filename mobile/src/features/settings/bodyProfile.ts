import type { ActivityLevel, BodyProfile, Goal, Sex, StoredBodyProfile } from "./types";

/** Accepted ranges — mirror backend/schemas/targets.py (the API re-validates). */
export const BODY_LIMITS = {
  age: { min: 18, max: 100 },
  height_cm: { min: 120, max: 230 },
  weight_kg: { min: 30, max: 300 },
} as const;

interface Option<T extends string> {
  value: T;
  label: string;
  hint: string;
}

export const SEX_OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const ACTIVITY_OPTIONS: Option<ActivityLevel>[] = [
  { value: "sedentary", label: "Sedentary", hint: "Desk job, little or no exercise" },
  { value: "light", label: "Lightly active", hint: "Exercise 1–3 days a week" },
  { value: "moderate", label: "Moderately active", hint: "Exercise 3–5 days a week" },
  { value: "very_active", label: "Very active", hint: "Hard exercise 6–7 days a week" },
  { value: "extra_active", label: "Extra active", hint: "Very hard exercise, a physical job, or training twice a day" },
];

export const GOAL_OPTIONS: Option<Goal>[] = [
  { value: "lose_weight", label: "Lose weight", hint: "Steady fat loss, about 0.75% of body weight per week" },
  { value: "maintain", label: "Maintain weight", hint: "Eat at your maintenance calories" },
  { value: "recomposition", label: "Recomposition", hint: "Lose fat and build muscle together — works best with resistance training" },
  { value: "build_muscle", label: "Build muscle", hint: "Lean bulk with a small ~10% surplus" },
  { value: "gain_weight", label: "Gain weight", hint: "Faster gain with a ~20% surplus" },
];

/** Form state for the body fields: numbers stay strings so half-typed input is allowed. */
export interface BodyDraft {
  sex: Sex | "";
  age: string;
  height_cm: string;
  weight_kg: string;
  activity_level: ActivityLevel | "";
  goal: Goal | "";
}

export const bodyDraftFrom = (profile: StoredBodyProfile): BodyDraft => ({
  sex: profile.sex ?? "",
  age: profile.age != null ? String(profile.age) : "",
  height_cm: profile.height_cm != null ? String(profile.height_cm) : "",
  weight_kg: profile.weight_kg != null ? String(profile.weight_kg) : "",
  activity_level: profile.activity_level ?? "",
  goal: profile.goal ?? "",
});

const inRange = (value: number, { min, max }: { min: number; max: number }) =>
  Number.isFinite(value) && value >= min && value <= max;

/** The draft as a complete, in-range profile — or null while anything is missing or out of range. */
export function parseBodyDraft(draft: BodyDraft): BodyProfile | null {
  if (!draft.sex || !draft.activity_level || !draft.goal) return null;
  if (!draft.age || !draft.height_cm || !draft.weight_kg) return null;
  const age = Number(draft.age);
  const height = Number(draft.height_cm);
  const weight = Number(draft.weight_kg);
  if (!inRange(age, BODY_LIMITS.age) || !inRange(height, BODY_LIMITS.height_cm) || !inRange(weight, BODY_LIMITS.weight_kg)) {
    return null;
  }
  return {
    sex: draft.sex,
    age: Math.round(age),
    height_cm: height,
    weight_kg: weight,
    activity_level: draft.activity_level,
    goal: draft.goal,
  };
}
