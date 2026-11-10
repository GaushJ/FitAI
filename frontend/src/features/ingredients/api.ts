import { request } from "@/lib/api/client";

interface ResolvedIngredientMacros {
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
}

/** Asks the backend (cache → LLM → web search) for an ingredient's per-100g macros. */
export const resolveIngredient = (params: { name: string; brand: string; weight_g: number }) =>
  request<ResolvedIngredientMacros>("/api/resolve-ingredient", {
    method: "POST",
    json: params,
    llmKeys: true,
    errorMessage: "Could not resolve ingredient",
  });
