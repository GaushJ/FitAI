import { apiRequest } from "@/lib/api/client";
import type { DashboardResponse, FrequentMeal, QuickLogResponse, TrackMealResponse } from "./types";

export function getDashboard(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/api/dashboard");
}

export function trackMealWithText(text: string): Promise<TrackMealResponse> {
  const form = new FormData();
  form.append("text", text);
  return apiRequest<TrackMealResponse>("/api/track-meal", { method: "POST", form });
}

/** React Native's FormData accepts a {uri, name, type} file descriptor, which
 * doesn't match the DOM FormData typings apiRequest's signature is written
 * against — hence the cast. */
export function trackMealWithAudio(fileUri: string): Promise<TrackMealResponse> {
  const form = new FormData();
  form.append("file", { uri: fileUri, name: "recording.m4a", type: "audio/m4a" } as unknown as Blob);
  return apiRequest<TrackMealResponse>("/api/track-meal", { method: "POST", form });
}

export function getFrequentMeals(): Promise<FrequentMeal[]> {
  return apiRequest<FrequentMeal[]>("/api/frequent-meals");
}

export function logFrequentMeal(id: number, portions?: Record<string, number>): Promise<QuickLogResponse> {
  return apiRequest<QuickLogResponse>(`/api/frequent-meals/${id}/log`, {
    method: "POST",
    json: { portions: portions ?? {} },
  });
}
