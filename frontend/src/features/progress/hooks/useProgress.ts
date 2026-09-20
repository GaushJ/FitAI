"use client";

import { useEffect, useState } from "react";
import { isUnauthorized } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/errors";
import { fetchProgress } from "@/features/progress/api";
import type { DaySummary, ProgressStats } from "@/features/progress/types";

const DEFAULT_TARGET_CALORIES = 2000;

/** The 90-day summaries, streak stats and calorie target behind the progress charts. */
export function useProgress(onUnauthorized: () => void) {
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [targetCalories, setTargetCalories] = useState(DEFAULT_TARGET_CALORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchProgress()
      .then((data) => {
        if (cancelled) return;
        setSummaries(data.summaries);
        setStats(data.stats);
        setTargetCalories(data.target_calories);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) return onUnauthorized();
        setError(getErrorMessage(err, "Network error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  return { summaries, stats, targetCalories, loading, error };
}
