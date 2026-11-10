import { apiRequest } from "@/lib/api/client";

export interface ResolvedMacros {
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

/** Same endpoint and message as web's features/ingredients/api.ts. */
export function resolveIngredient(body: { name: string; brand: string; weight_g: number }): Promise<ResolvedMacros> {
  return apiRequest<ResolvedMacros>("/api/resolve-ingredient", {
    method: "POST",
    json: body,
    errorMessage: "Could not resolve ingredient",
  });
}
