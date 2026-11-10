import { Directory, File, Paths } from "expo-file-system";
import { apiRequest } from "@/lib/api/client";
import { getToken } from "@/lib/api/authStorage";
import { API_BASE_URL } from "@/lib/api/config";
import type { BrandPreference, LabelExtractResponse, LabelUnit, Per100gMacros } from "./types";

// Same endpoints, functions and messages as frontend/src/features/brand-preferences/api.ts.
const BASE = "/api/brand-preferences";

export const fetchBrandPreferences = () => apiRequest<BrandPreference[]>(BASE);

export const saveBrandPreference = (body: { ingredient_name: string; preferred_brand: string } & Partial<Per100gMacros>) =>
  apiRequest(BASE, { method: "POST", json: body, errorMessage: "Save failed" });

export const deleteBrandPreference = (ingredientName: string) =>
  apiRequest(`${BASE}/${encodeURIComponent(ingredientName)}`, { method: "DELETE" });

export const renameBrandPreference = (ingredientName: string, body: { new_ingredient_name: string; new_brand: string }) =>
  apiRequest(`${BASE}/${encodeURIComponent(ingredientName)}/rename`, {
    method: "PATCH",
    json: body,
    errorMessage: "Rename failed",
  });

export const updateBrandPreferenceMacros = (ingredientName: string, macros: Per100gMacros) =>
  apiRequest(`${BASE}/${encodeURIComponent(ingredientName)}/macros`, {
    method: "PATCH",
    json: macros,
    errorMessage: "Macro save failed",
  });

/** React Native's FormData takes a {uri, name, type} descriptor where web passes a File — hence the cast. */
export function extractBrandLabel(params: {
  ingredient: string;
  brand: string;
  image: { uri: string; name: string; type: string };
  unit: LabelUnit;
}) {
  const form = new FormData();
  form.append("ingredient_name", params.ingredient);
  form.append("preferred_brand", params.brand);
  form.append("image", params.image as unknown as Blob);
  form.append("unit", params.unit);
  return apiRequest<LabelExtractResponse>(`${BASE}/label`, { method: "POST", form, errorMessage: "Extraction failed" });
}

/** Downloads the .xlsx export into the app cache; the caller hands the file to the share sheet
 * (the phone's equivalent of web's browser download). */
export async function exportBrandPreferences(): Promise<File> {
  const token = await getToken();
  return File.downloadFileAsync(`${API_BASE_URL}${BASE}/export`, new Directory(Paths.cache), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    idempotent: true,
  });
}

export function importBrandPreferences(file: { uri: string; name: string; mimeType?: string }) {
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  } as unknown as Blob);
  return apiRequest<{ message: string; warnings?: string[] }>(`${BASE}/import`, { method: "POST", form, errorMessage: "Import failed" });
}
