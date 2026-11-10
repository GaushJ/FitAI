"use client";

import { useMemo, useState } from "react";

/** What feature hooks need to surface a page-level message. */
export interface Notifier {
  success: (text: string) => void;
  error: (text: string) => void;
  /** Clears both messages — call at the start of a new action. */
  clear: () => void;
}

/** Holds the page-level success / error banners and hands out a stable `notifier`. */
export function useFeedback() {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const notifier = useMemo<Notifier>(
    () => ({
      success: setSuccess,
      error: setError,
      clear: () => {
        setSuccess("");
        setError("");
      },
    }),
    [],
  );

  return {
    success,
    error,
    dismissSuccess: () => setSuccess(""),
    dismissError: () => setError(""),
    notifier,
  };
}
