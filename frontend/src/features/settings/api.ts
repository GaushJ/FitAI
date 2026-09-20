import { request } from "@/lib/api/client";
import type { BodyProfile, ProfileUpdate, TargetPlan } from "@/features/settings/types";

export const updateProfile = (update: ProfileUpdate) =>
  request("/api/user", { method: "POST", json: update, errorMessage: "Failed to update targets" });

/** Suggests calories + macros from body stats and a goal. Nothing is saved server-side. */
export const calculateTargets = (body: BodyProfile) =>
  request<TargetPlan>("/api/user/targets/calculate", {
    method: "POST",
    json: body,
    errorMessage: "Couldn't calculate targets",
  });
