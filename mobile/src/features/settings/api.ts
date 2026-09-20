import { apiRequest } from "@/lib/api/client";
import type { BodyProfile, TargetPlan, UserSettings, UserSettingsUpdate } from "./types";

export function updateUser(payload: UserSettingsUpdate): Promise<{ status: string; user: UserSettings }> {
  return apiRequest("/api/user", { method: "POST", json: payload });
}

/** Suggests calories + macros from body stats and a goal. Nothing is saved server-side. */
export function calculateTargets(body: BodyProfile): Promise<TargetPlan> {
  return apiRequest("/api/user/targets/calculate", { method: "POST", json: body });
}
