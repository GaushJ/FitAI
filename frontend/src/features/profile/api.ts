import { request } from "@/lib/api/client";
import type { UserProfile } from "@/features/settings/types";

export interface AccountProfile extends UserProfile {
  username: string;
}

export const fetchProfile = () => request<AccountProfile>("/api/user", { errorMessage: "Couldn't load your profile" });
