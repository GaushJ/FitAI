export type LabelUnit = "g" | "ml";

export interface BrandPreference {
  ingredient_name: string;
  preferred_brand: string;
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
  unit?: LabelUnit;
}

/** Ingredient + brand pair shared by the "By Name" and "Label" tabs. */
export interface BrandIdentity {
  ingredient: string;
  brand: string;
}

/** Per-100g macros as strings, for controlled number inputs. */
export interface MacroDraft {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Per100gMacros {
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export interface ExtractedLabel {
  macros: Record<string, number>;
  unit: LabelUnit;
}
