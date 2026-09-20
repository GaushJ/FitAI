"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Loads a list once on mount and exposes `refresh`. Failures are swallowed on
 * purpose: these are secondary lists, so a failed load just leaves the last
 * known items in place rather than raising a page-level error.
 *
 * `load` must be referentially stable (e.g. a module-level API function).
 */
export function useRemoteList<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);

  const refresh = useCallback(() => load().then(setItems, () => undefined), [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, setItems, refresh };
}
