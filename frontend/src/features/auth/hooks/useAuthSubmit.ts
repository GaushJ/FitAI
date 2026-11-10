"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/lib/errors";
import { storeAuth } from "@/lib/storage/authStorage";
import type { AuthResponse } from "@/features/auth/api";

/** Shared submit flow for login and signup: call the API, persist the session, go to the dashboard. */
export function useAuthSubmit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (action: () => Promise<AuthResponse>) => {
    setError("");
    setLoading(true);
    try {
      const { access_token, user } = await action();
      storeAuth(access_token, user);
      router.replace("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Network error. Is the backend running?"));
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, submit };
}
