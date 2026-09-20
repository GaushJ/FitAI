"use client";

import { useState } from "react";
import { FrequentMealsRow } from "@/features/frequent-meals/components/FrequentMealsRow";
import { PortionEditorModal } from "@/features/frequent-meals/components/PortionEditorModal";
import type { useFrequentMeals } from "@/features/frequent-meals/hooks/useFrequentMeals";
import type { FrequentMeal } from "@/features/frequent-meals/types";

type FrequentMealsState = ReturnType<typeof useFrequentMeals>;

/** The quick-log row plus the portion-adjust dialog it opens. */
export function FrequentMealsSection({ frequent }: { frequent: FrequentMealsState }) {
  const [adjusting, setAdjusting] = useState<FrequentMeal | null>(null);

  return (
    <>
      <FrequentMealsRow
        meals={frequent.meals}
        loggingId={frequent.loggingId}
        onLog={(meal) => frequent.quickLog(meal)}
        onAdjustPortions={setAdjusting}
        onRemove={frequent.remove}
      />

      {adjusting && (
        <PortionEditorModal
          meal={adjusting}
          logging={frequent.loggingId === adjusting.id}
          onClose={() => setAdjusting(null)}
          onConfirm={async (portions) => {
            if (await frequent.quickLog(adjusting, portions)) setAdjusting(null);
          }}
        />
      )}
    </>
  );
}
