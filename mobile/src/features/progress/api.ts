import { apiRequest } from "@/lib/api/client";
import type { HistoryResponse, ProgressResponse } from "./types";

// Same as frontend/src/features/progress/api.ts.
export const HISTORY_PAGE_SIZE = 15;

export const fetchProgress = () => apiRequest<ProgressResponse>("/api/progress", { errorMessage: "Failed to load progress" });

export const fetchHistory = (page: number) =>
  apiRequest<HistoryResponse>(`/api/history?page=${page}&per_page=${HISTORY_PAGE_SIZE}`, {
    errorMessage: "Failed to load history",
  });
