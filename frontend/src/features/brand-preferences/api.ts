import { apiFetch, request } from "@/lib/api/client";
import type { BrandPreference, LabelUnit, Per100gMacros } from "@/features/brand-preferences/types";

const BASE = "/api/brand-preferences";
const nameUrl = (ingredientName: string) => `${BASE}/${encodeURIComponent(ingredientName)}`;

export const fetchBrandPreferences = () => request<BrandPreference[]>(BASE);

export const saveBrandPreference = (body: {
  ingredient_name: string;
  preferred_brand: string;
} & Partial<Per100gMacros>) =>
  request(BASE, { method: "POST", json: body, errorMessage: "Save failed" });

export const deleteBrandPreference = (ingredientName: string) =>
  request(nameUrl(ingredientName), { method: "DELETE" });

export const renameBrandPreference = (
  ingredientName: string,
  rename: { new_ingredient_name: string; new_brand: string },
) =>
  request(`${nameUrl(ingredientName)}/rename`, {
    method: "PATCH",
    json: rename,
    errorMessage: "Rename failed",
  });

export const updateBrandPreferenceMacros = (ingredientName: string, macros: Per100gMacros) =>
  request(`${nameUrl(ingredientName)}/macros`, {
    method: "PATCH",
    json: macros,
    errorMessage: "Macro save failed",
  });

/** Reads a nutrition-facts photo with vision and saves the exact macros. */
export function extractBrandLabel(params: {
  ingredient: string;
  brand: string;
  image: File;
  unit: LabelUnit;
}) {
  const form = new FormData();
  form.append("ingredient_name", params.ingredient);
  form.append("preferred_brand", params.brand);
  form.append("image", params.image);
  form.append("unit", params.unit);
  return request<{ macros: Record<string, number>; unit?: LabelUnit }>(`${BASE}/label`, {
    method: "POST",
    form,
    llmKeys: true,
    errorMessage: "Extraction failed",
  });
}

const DEFAULT_EXPORT_FILENAME = "macronaut_brand_preferences.xlsx";

export async function exportBrandPreferences(): Promise<{ blob: Blob; filename: string }> {
  const res = await apiFetch(`${BASE}/export`);
  if (!res.ok) throw new Error("Export failed");
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? DEFAULT_EXPORT_FILENAME;
  return { blob: await res.blob(), filename };
}

export function importBrandPreferences(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<{ message: string; warnings?: string[] }>(`${BASE}/import`, {
    method: "POST",
    form,
    errorMessage: "Import failed",
  });
}
