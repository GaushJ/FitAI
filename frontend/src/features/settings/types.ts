export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very_active" | "extra_active";
export type Goal = "lose_weight" | "maintain" | "recomposition" | "build_muscle" | "gain_weight";

/** Body stats the targets are derived from. Metric units. */
export interface BodyProfile {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
}

export interface UserProfile extends Partial<{ [K in keyof BodyProfile]: BodyProfile[K] | null }> {
  name: string;
  current_streak: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
}

export type TargetKey = "target_calories" | "target_protein" | "target_carbs" | "target_fat";

export type ProfileUpdate = Pick<UserProfile, "name" | TargetKey> & Partial<BodyProfile>;

/** Suggestion returned by POST /api/user/targets/calculate. */
export interface TargetPlan {
  bmr: number;
  tdee: number;
  bmi: number;
  /** Goal actually applied — can differ from the requested one (e.g. underweight → maintain). */
  goal: Goal;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** calories − tdee; negative is a deficit. */
  calorie_adjustment: number;
  warnings: string[];
}
