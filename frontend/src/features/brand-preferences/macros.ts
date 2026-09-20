import type { MacroDraft, Per100gMacros } from "@/features/brand-preferences/types";

/** Parses a draft into numbers, or null unless all four values are valid. */
export function parseMacroDraft(draft: MacroDraft): Per100gMacros | null {
  const parsed: Per100gMacros = {
    calories_per_100g: parseFloat(draft.calories),
    protein_per_100g: parseFloat(draft.protein),
    carbs_per_100g: parseFloat(draft.carbs),
    fat_per_100g: parseFloat(draft.fat),
  };
  return Object.values(parsed).some(Number.isNaN) ? null : parsed;
}

const toText = (value: number | null | undefined) => (value != null ? String(value) : "");

export const macroDraftFrom = (values: {
  calories_per_100g?: number | null;
  protein_per_100g?: number | null;
  carbs_per_100g?: number | null;
  fat_per_100g?: number | null;
}): MacroDraft => ({
  calories: toText(values.calories_per_100g),
  protein: toText(values.protein_per_100g),
  carbs: toText(values.carbs_per_100g),
  fat: toText(values.fat_per_100g),
});
