import type { ReactNode } from "react";
import type { Macros } from "@/types/nutrition";

interface MealTemplateCardProps {
  name: string;
  macros: Macros;
  /** Muted line under the macros, e.g. "3× logged". */
  meta: string;
  /** Action buttons pinned to the bottom of the card. */
  actions: ReactNode;
}

/** Compact fixed-width card used in the horizontally scrolling meal rows. */
export function MealTemplateCard({ name, macros, meta, actions }: MealTemplateCardProps) {
  return (
    <div className="relative flex w-44 shrink-0 flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 transition hover:border-accent/30">
      <p className="line-clamp-2 text-xs font-semibold leading-tight text-slate-200">{name}</p>

      <div className="flex flex-col gap-0.5 text-[10px] text-slate-500">
        <span className="font-bold text-orange-400">{Math.round(macros.calories)} kcal</span>
        <span>
          P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
        </span>
        <span className="text-slate-600">{meta}</span>
      </div>

      <div className="mt-auto flex gap-1.5">{actions}</div>
    </div>
  );
}
