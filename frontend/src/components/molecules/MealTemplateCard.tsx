import type { ReactNode } from "react";
import type { Macros } from "@/types/nutrition";

interface MealTemplateCardProps {
  name: string;
  macros: Macros;
  /** Small tag in the top-right corner, e.g. "4× logged". */
  meta: string;
  /** Optional muted line under the name, e.g. the ingredient list. */
  description?: string;
  /** Action buttons along the bottom of the card. */
  actions: ReactNode;
}

/** A frequent or saved meal: name, calories, macro split and quick actions. */
export function MealTemplateCard({ name, macros, meta, description, actions }: MealTemplateCardProps) {
  return (
    <div className="border border-line bg-surface-low p-4 transition hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-lg font-semibold leading-tight text-ink">{name}</p>
        <span className="shrink-0 bg-surface-highest px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">{meta}</span>
      </div>
      {description && <p className="mt-1 line-clamp-2 font-mono text-[11px] text-ink-muted">{description}</p>}
      <p className="mt-1 font-display text-xl font-semibold text-primary">{Math.round(macros.calories)} kcal</p>
      <p className="font-mono text-[11px] text-ink-muted">
        P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
      </p>
      <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">{actions}</div>
    </div>
  );
}
