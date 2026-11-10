import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api/client";
import type { UserSettings } from "@/features/settings/types";

/** GET /api/user — the same profile web's ProfileProvider loads. */
export interface AccountProfile extends UserSettings {
  username: string;
  current_streak: number;
  is_pro: boolean;
}

export const fetchProfile = () => apiRequest<AccountProfile>("/api/user", { errorMessage: "Couldn't load your profile" });

interface ProfileContextValue {
  /** Null until the first load succeeds. */
  profile: AccountProfile | null;
  /** Re-pull after anything that changes name, targets, streak or Pro status. */
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Signed-in user's profile, shared by the app header and every tab (mirrors web's ProfileProvider).
 * A 401 is handled centrally by apiRequest, which signs the user out. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  const refresh = useCallback(
    () =>
      fetchProfile().then(setProfile, () => {
        // Other failures leave the last profile in place; screens show their own errors.
      }),
    []
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <ProfileContext.Provider value={{ profile, refresh }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside <ProfileProvider>");
  return value;
}
