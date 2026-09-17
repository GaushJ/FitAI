import { apiRequest } from "@/lib/api/client";
import type { UserTargets } from "./types";

export function updateUser(payload: UserTargets): Promise<{ status: string; user: UserTargets }> {
  return apiRequest("/api/user", { method: "POST", json: payload });
}
