export interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_count: number;
  target_calories: number;
  status: "met" | "over" | "under" | "minimal" | "empty";
}

export interface ProgressStats {
  current_streak: number;
  best_streak: number;
  total_days_logged: number;
  total_meals: number;
}

export interface ProgressResponse {
  summaries: DaySummary[];
  stats: ProgressStats;
  target_calories: number;
}

export interface HistoryIngredient {
  name: string;
  brand: string | null;
  weight_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface HistoryMeal {
  id: number;
  date: string;
  raw_transcript: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  ingredients: HistoryIngredient[];
}

export interface HistoryResponse {
  meals: HistoryMeal[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
