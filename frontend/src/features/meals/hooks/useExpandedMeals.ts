"use client";

import { useCallback, useState } from "react";

/** Tracks which meal cards are expanded in a list. */
export function useExpandedMeals() {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const expand = useCallback((id: number) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  return { expandedIds, toggle, expand };
}
