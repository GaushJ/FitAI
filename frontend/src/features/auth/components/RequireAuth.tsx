"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken, subscribeToAuthChanges } from "@/lib/storage/authStorage";

const hasToken = () => Boolean(getStoredToken());
const serverHasToken = () => false;

/**
 * Renders `children` only for signed-in users, redirecting everyone else to
 * /login. Children never mount without a token, so their data hooks don't
 * fire unauthenticated requests.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeToAuthChanges, hasToken, serverHasToken);

  useEffect(() => {
    // Read storage directly: the hydration render sees the server snapshot (false).
    if (!getStoredToken()) router.replace("/login");
  }, [router]);

  return signedIn ? children : null;
}
