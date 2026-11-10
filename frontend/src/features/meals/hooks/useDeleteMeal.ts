"use client";

import { useState } from "react";
import type { Notifier } from "@/hooks/useFeedback";
import { getErrorMessage } from "@/lib/errors";
import { deleteMeal } from "@/features/meals/api";

export function useDeleteMeal(notify: Notifier, onDeleted: () => Promise<void> | void) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const remove = async (mealId: number) => {
    setDeletingId(mealId);
    try {
      await deleteMeal(mealId);
      notify.success("Meal deleted.");
      await onDeleted();
    } catch (err) {
      notify.error(getErrorMessage(err, "Failed to delete meal."));
    } finally {
      setDeletingId(null);
    }
  };

  return { deletingId, remove };
}
