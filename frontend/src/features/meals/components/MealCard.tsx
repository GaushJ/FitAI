import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MacroInline } from "@/components/molecules/MacroInline";
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

/** A logged meal: transcript + macro pill, expanding into its ingredient breakdown. */
export function MealCard({
  meal,
  dateLabel,
  expanded,
  onToggle,
  actions,
  showTotal,
  onEditIngredient,
}: MealCardProps) {
  const Chevron = expanded ? ChevronUp : ChevronDown;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/70 transition duration-200 hover:border-slate-800">
      <div className={cn("flex items-start", Boolean(actions) && "gap-2 pr-3")}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-start justify-between gap-4 p-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold italic leading-snug text-slate-200">
              &ldquo;{meal.raw_transcript}&rdquo;
            </p>
            <span className="mt-1 block text-[10px] text-slate-500">
              {dateLabel} · {pluralize(meal.ingredients.length, "ingredient")}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-right">
              <span className="text-xs font-bold leading-none text-orange-400">
                {Math.round(meal.macros.calories)} kcal
              </span>
              <MacroInline macros={meal.macros} size="sm" showCalories={false} className="mt-0.5" />
            </div>
            <Chevron className="h-4 w-4 shrink-0 text-slate-500" />
          </div>
        </button>

        {actions}
      </div>

      {expanded && (
        <div className="border-t border-slate-900 px-4 pt-3 pb-4">
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
