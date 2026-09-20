import type { ActivityLevel, Goal, Sex } from "@/features/settings/types";

interface Option<T extends string> {
  value: T;
  label: string;
  hint: string;
}

export const SEX_TABS: Array<{ id: Sex; label: string }> = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
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
