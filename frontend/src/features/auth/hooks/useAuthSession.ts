"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAuth, getStoredToken } from "@/lib/storage/authStorage";

/** Clears the stored session and sends the user to the login screen. */
export function useLogout() {
  const router = useRouter();
  return useCallback(() => {
    clearAuth();
    router.replace("/login");
  }, [router]);
}

/** Skips the login screen when a session already exists. */
export function useRedirectIfAuthenticated(destination: string) {
  const router = useRouter();
  useEffect(() => {
    if (getStoredToken()) router.replace(destination);
  }, [router, destination]);
}
