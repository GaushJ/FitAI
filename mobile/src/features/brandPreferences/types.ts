export interface BrandPreference {
  ingredient_name: string;
  preferred_brand: string;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  unit: "g" | "ml";
}

export interface ResolvedMacros {
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface SaveBrandPreferencePayload {
  ingredient_name: string;
  preferred_brand: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
}

export interface LabelExtractResponse {
  status: string;
  ingredient_name: string;
  preferred_brand: string;
  macros: ResolvedMacros;
  unit: "g" | "ml";
  source: string;
}
