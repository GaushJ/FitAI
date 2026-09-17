export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SavedMealIngredient {
  name: string;
  brand?: string | null;
  weight_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface SavedMeal {
  id: number;
  name: string;
  ingredients: SavedMealIngredient[];
  macros: Macros;
  created_at: string;
  updated_at: string;
}

export interface LogSavedMealResponse {
  status: string;
  streak: number;
  ingredients: SavedMealIngredient[];
  macros: Macros;
  name: string;
}

export interface ResolvedIngredientMacros {
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}
