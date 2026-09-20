import type { MealLog } from "@/features/meals/types";

export type DayStatus = "met" | "over" | "under" | "minimal" | "empty";

export interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_count: number;
  target_calories: number;
  status: DayStatus;
}

export interface ProgressStats {
  current_streak: number;
  best_streak: number;
  total_days_logged: number;
  total_meals: number;
}

export interface ProgressData {
  summaries: DaySummary[];
  stats: ProgressStats;
  target_calories: number;
}

export interface HistoryPage {
  meals: MealLog[];
  total: number;
  page: number;
}
