import { apiRequest } from "@/lib/api/client";
import type { HistoryResponse, ProgressResponse } from "./types";

export function getProgress(): Promise<ProgressResponse> {
  return apiRequest<ProgressResponse>("/api/progress");
}

export function getHistory(page: number, perPage = 15): Promise<HistoryResponse> {
  return apiRequest<HistoryResponse>(`/api/history?page=${page}&per_page=${perPage}`);
}
