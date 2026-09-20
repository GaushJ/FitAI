import type { ActivityLevel, BodyProfile, Goal, Sex, UserProfile } from "@/features/settings/types";

/** Accepted ranges — mirror backend/schemas/targets.py (the API re-validates). */
export const BODY_LIMITS = {
  age: { min: 18, max: 100 },
  height_cm: { min: 120, max: 230 },
  weight_kg: { min: 30, max: 300 },
} as const;

/** Form state for the body fields: numbers stay strings so half-typed input is allowed. */
export interface BodyDraft {
  sex: Sex | "";
  age: string;
  height_cm: string;
  weight_kg: string;
  activity_level: ActivityLevel | "";
  goal: Goal | "";
}

export const bodyDraftFrom = (profile: UserProfile): BodyDraft => ({
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
  const age = Number(draft.age);
  const height = Number(draft.height_cm);
  const weight = Number(draft.weight_kg);
  if (!draft.sex || !draft.activity_level || !draft.goal) return null;
  if (!draft.age || !draft.height_cm || !draft.weight_kg) return null;
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
