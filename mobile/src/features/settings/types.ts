export interface UserTargets {
  name: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
}

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type Goal = "lose_weight" | "maintain" | "recomposition" | "build_muscle" | "gain_weight";

/** Body stats the daily targets are derived from. Metric units. */
export interface BodyProfile {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
}

/** The stored profile: every body field may be missing until the user fills it in. */
export type StoredBodyProfile = Partial<{ [K in keyof BodyProfile]: BodyProfile[K] | null }>;

/** What the settings sheet reads and what the API echoes back after a save. */
export type UserSettings = UserTargets & StoredBodyProfile;

/** What POST /api/user accepts: targets plus any body fields the user has filled in. */
export type UserSettingsUpdate = UserTargets & Partial<BodyProfile>;

/** Suggestion from POST /api/user/targets/calculate (Mifflin-St Jeor + Atwater; no AI). */
export interface TargetPlan {
  bmr: number;
  tdee: number;
  bmi: number;
  /** The goal actually applied — can differ from the requested one (e.g. underweight → maintain). */
  goal: Goal;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** calories − tdee; negative is a deficit. */
  calorie_adjustment: number;
  warnings: string[];
}
