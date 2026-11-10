import { request } from "@/lib/api/client";
import type { ScanLabelsResult, TrackMealResult } from "@/features/meals/types";

export function trackMeal(text: string) {
  const form = new FormData();
  form.append("text", text);
  return request<TrackMealResult>("/api/track-meal", {
    method: "POST",
    form,
    llmKeys: true,
    errorMessage: "Macro parsing failed",
  });
}

export function transcribeAudio(audio: Blob) {
  const form = new FormData();
  form.append("file", audio, "recording.webm");
  return request<{ transcript: string }>("/api/transcribe", {
    method: "POST",
    form,
    llmKeys: true,
    errorMessage: "Transcription failed",
  });
}

export function scanLabels(images: File[]) {
  const form = new FormData();
  images.forEach((image) => form.append("images", image));
  return request<ScanLabelsResult>("/api/ingredients/scan-labels", {
    method: "POST",
    form,
    llmKeys: true,
    errorMessage: "Label scan failed.",
  });
}

export const deleteMeal = (mealId: number) =>
  request(`/api/meals/${mealId}`, { method: "DELETE", errorMessage: "Delete failed" });

export const updateIngredient = (
  mealId: number,
  index: number,
  values: {
    weight_g: number;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
  },
) =>
  request(`/api/meals/${mealId}/ingredients/${index}`, {
    method: "PATCH",
    json: values,
    errorMessage: "Update failed",
  });
