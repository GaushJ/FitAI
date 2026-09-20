import { request } from "@/lib/api/client";
import type { HistoryPage, ProgressData } from "@/features/progress/types";

export const HISTORY_PAGE_SIZE = 15;

export const fetchProgress = () =>
  request<ProgressData>("/api/progress", { errorMessage: "Failed to load progress" });

export const fetchHistory = (page: number) =>
  request<HistoryPage>(`/api/history?page=${page}&per_page=${HISTORY_PAGE_SIZE}`, {
    errorMessage: "Failed to load history",
  });
