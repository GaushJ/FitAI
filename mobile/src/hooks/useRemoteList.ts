import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Same as web's useRemoteList, except it reloads whenever the tab regains focus — tabs stay mounted,
 * so this stands in for web reloading a page on navigation. Failures are swallowed on purpose: these
 * are secondary lists, so a failed load just leaves the last known items in place.
 *
 * `load` must be referentially stable (e.g. a module-level API function).
 */
export function useRemoteList<T>(load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);

  const refresh = useCallback(() => load().then(setItems, () => undefined), [load]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { items, setItems, refresh };
}
