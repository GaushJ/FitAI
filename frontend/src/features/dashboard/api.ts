import { request } from "@/lib/api/client";
import type { DashboardData } from "@/features/dashboard/types";

export const fetchDashboard = () =>
  request<DashboardData>("/api/dashboard", { errorMessage: "Backend connection failed" });
