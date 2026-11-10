"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isUnauthorized } from "@/lib/api/client";
import { useLogout } from "@/features/auth/hooks/useAuthSession";
import { fetchProfile, type AccountProfile } from "@/features/profile/api";

interface ProfileContextValue {
  /** Null until the first load succeeds. */
  profile: AccountProfile | null;
  /** Re-pull after anything that changes name, targets, streak or Pro status. */
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Signed-in user's profile, shared by the sidebar and every app page. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const logout = useLogout();
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  const refresh = useCallback(
    () =>
      fetchProfile().then(setProfile, (err) => {
        // Other failures leave the last profile in place; pages show their own errors.
        if (isUnauthorized(err)) logout();
      }),
    [logout],
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
