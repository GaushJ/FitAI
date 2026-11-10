"use client";

import { useRemoteList } from "@/hooks/useRemoteList";
import { deleteBrandPreference, fetchBrandPreferences } from "@/features/brand-preferences/api";

export function useBrandPreferences() {
  const { items: preferences, refresh } = useRemoteList(fetchBrandPreferences);

  const remove = async (ingredientName: string) => {
    try {
      await deleteBrandPreference(ingredientName);
      await refresh();
    } catch {
      /* silent — the row simply stays */
    }
  };

  return { preferences, refresh, remove };
}
