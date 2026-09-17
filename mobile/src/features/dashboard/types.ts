export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Ingredient {
  name: string;
  brand: string | null;
  weight_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface MealLog {
  id: number;
  raw_transcript: string;
  date: string;
  macros: Macros;
  ingredients: Ingredient[];
}

export interface DashboardUser {
  name: string;
  username: string;
  current_streak: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
}

export interface DashboardResponse {
  user: DashboardUser;
  totals: Macros;
  meals: MealLog[];
}

export interface FrequentMeal {
  id: number;
  display_name: string;
  ingredients: Ingredient[];
  macros: Macros;
  log_count: number;
  last_logged: string;
}

export interface TrackMealResponse {
  status: string;
  transcript: string;
  streak: number;
  ingredients: Ingredient[];
  macros: Macros;
  warning: string | null;
}

export interface QuickLogResponse {
  status: string;
  streak: number;
  ingredients: Ingredient[];
  macros: Macros;
  display_name: string;
}
