import { apiRequest } from "@/lib/api/client";
import type { BrandPreference, LabelExtractResponse, ResolvedMacros, SaveBrandPreferencePayload } from "./types";

export function getBrandPreferences(): Promise<BrandPreference[]> {
  return apiRequest<BrandPreference[]>("/api/brand-preferences");
}

export function saveBrandPreference(
  payload: SaveBrandPreferencePayload
): Promise<{ status: string; ingredient_name: string; preferred_brand: string }> {
  return apiRequest("/api/brand-preferences", { method: "POST", json: payload });
}

export function updateBrandPreference(
  ingredientName: string,
  newName: string,
  newBrand: string,
  macros: ResolvedMacros
): Promise<{ status: string; ingredient_name: string }> {
  const nameChanged = newName.trim().toLowerCase() !== ingredientName.toLowerCase();
  const renamed = nameChanged
    ? apiRequest<{ status: string; ingredient_name: string; brand: string }>(
        `/api/brand-preferences/${encodeURIComponent(ingredientName)}/rename`,
        { method: "PATCH", json: { new_ingredient_name: newName, new_brand: newBrand } }
      )
    : Promise.resolve(null);

  return renamed.then((renameResult) =>
    apiRequest(`/api/brand-preferences/${encodeURIComponent(renameResult ? renameResult.ingredient_name : ingredientName)}/macros`, {
      method: "PATCH",
      json: macros,
    })
  );
}

export function deleteBrandPreference(ingredientName: string): Promise<{ status: string; ingredient_name: string }> {
  return apiRequest(`/api/brand-preferences/${encodeURIComponent(ingredientName)}`, { method: "DELETE" });
}

export function resolveIngredientMacros(name: string, brand: string, weightG = 100): Promise<ResolvedMacros> {
  return apiRequest<ResolvedMacros>("/api/resolve-ingredient", {
    method: "POST",
    json: { name, brand, weight_g: weightG },
  });
}

export interface SaveByLabelParams {
  ingredientName: string;
  preferredBrand: string;
  unit: "g" | "ml";
  imageUri: string;
  imageName: string;
  imageType: string;
}

/** See dashboard's trackMealWithAudio for why the {uri, name, type} descriptor needs this cast. */
export function saveBrandFromLabel(params: SaveByLabelParams): Promise<LabelExtractResponse> {
  const form = new FormData();
  form.append("ingredient_name", params.ingredientName);
  form.append("preferred_brand", params.preferredBrand);
  form.append("unit", params.unit);
  form.append("image", { uri: params.imageUri, name: params.imageName, type: params.imageType } as unknown as Blob);
  return apiRequest<LabelExtractResponse>("/api/brand-preferences/label", { method: "POST", form });
}
