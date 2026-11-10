import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { pluralize } from "@/lib/nutrition";
import { IngredientBreakdown } from "@/features/meals/components/IngredientBreakdown";
import type { MealLog } from "@/features/meals/types";
import type { Ingredient } from "@/types/nutrition";

interface MealCardProps {
  meal: MealLog;
  dateLabel: string;
  expanded: boolean;
  onToggle: () => void;
  /** Icon buttons pinned beside the header, outside the expand toggle. */
  actions?: ReactNode;
  /** Adds a summary row to the expanded breakdown. */
  showTotal?: boolean;
  onEditIngredient?: (index: number, ingredient: Ingredient) => void;
}

/** A logged meal: transcript + macro block, expanding into its ingredient breakdown. */
export function MealCard({ meal, dateLabel, expanded, onToggle, actions, showTotal, onEditIngredient }: MealCardProps) {
  const { macros } = meal;

  return (
    <div className={cn("border bg-card transition", expanded ? "border-ink" : "border-line hover:border-line-strong")}>
      <div className={cn("flex items-start", expanded && "bg-surface-low")}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 gap-3">
            <span className="mt-1.5 size-2 shrink-0 bg-primary" />
            <div className="min-w-0">
              <p className="font-display text-base font-medium italic leading-snug text-ink">
                &ldquo;{meal.raw_transcript}&rdquo;
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-muted">
                {dateLabel} · {pluralize(meal.ingredients.length, "ingredient")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-4 border border-line bg-card px-3 py-2">
              <div className="text-center">
                <p className="font-display text-2xl font-bold leading-none text-primary">{Math.round(macros.calories)}</p>
                <p className="font-mono text-[10px] uppercase text-ink-muted">kcal</p>
              </div>
              <div className="grid grid-cols-3 gap-x-3 font-mono text-[11px]">
                <span className="text-ink-muted">P</span>
                <span className="text-ink-muted">C</span>
                <span className="text-ink-muted">F</span>
                <span className="text-ink">{macros.protein}g</span>
                <span className="text-ink">{macros.carbs}g</span>
                <span className="text-ink">{macros.fat}g</span>
              </div>
            </div>
            <ChevronDown className={cn("size-4 shrink-0 text-ink-muted transition-transform", expanded && "rotate-180")} />
          </div>
        </button>

        {actions && <div className="flex shrink-0 flex-col gap-1 p-2 sm:flex-row sm:self-center">{actions}</div>}
      </div>

      {expanded && (
        <div className="border-t border-line px-4 pt-3 pb-4">
          <IngredientBreakdown
            ingredients={meal.ingredients}
            total={showTotal ? meal.macros : undefined}
            onEditIngredient={onEditIngredient}
          />
        </div>
      )}
    </div>
  );
}
